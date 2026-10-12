-- ============================================================
-- Membership Status
-- Returns one row per member profile with their membership status
-- (Current, Lapsed, Never Purchased), latest purchase details,
-- membership tier, expiration date, and qualifying purchase counts.
-- Category: Skip/Memberships/Roster
-- Reusable: true
-- Params (both optional; omit both for every member):
--   PersonID       - one member (used by the member page)
--   OrganizationID - that organization's staff (used by the Staff panel)
-- ============================================================
SELECT
    mp.ID                                         AS MemberProfileID,
    mp.PersonID,
    mp.MemberNumber,
    p.DisplayName                                 AS MemberName,
    mp.Segment,
    mp.Region,
    mp.JoinDate,
    pa.LastPurchaseDate                           AS LastMembershipPurchaseDate,
    pa.LastOrderNumber                            AS LastMembershipOrderNumber,
    pa.MembershipTier,
    DATEADD(month, 12, pa.LastPurchaseDate)       AS MembershipExpiresOn,
    ISNULL(pa.PurchaseCount, 0)                   AS MembershipPurchaseCount,
    CASE
        WHEN pa.LastPurchaseDate IS NULL THEN 'Never Purchased'
        WHEN pa.LastPurchaseDate >= DATEADD(month, -12, CAST(GETDATE() AS date)) THEN 'Current'
        ELSE 'Lapsed'
    END                                           AS MembershipStatus

FROM [morecheese_members].vwMemberProfiles mp

    -- Link each member profile to person display details
    LEFT JOIN [__mj_BizAppsCommon].vwPeople p
        ON p.ID = mp.PersonID

    -- Aggregate qualifying annual membership purchases per person
    LEFT JOIN (
        SELECT
            q.PersonID,
            MAX(CASE WHEN q.rn = 1 THEN q.OrderDate END)      AS LastPurchaseDate,
            MAX(CASE WHEN q.rn = 1 THEN q.OrderNumber END)    AS LastOrderNumber,
            MAX(CASE WHEN q.rn = 1 THEN q.MembershipTier END) AS MembershipTier,
            COUNT(*)                                          AS PurchaseCount
        FROM (
            SELECT
                mp_inner.PersonID,
                oh.ID                                         AS OrderHeaderID,
                oh.OrderNumber,
                oh.OrderDate,

                -- Strip ' Membership (annual)' suffix to derive tier name
                LEFT(pr.Name, LEN(pr.Name) - LEN(' Membership (annual)')) AS MembershipTier,

                -- Order purchases descending by date and ID to break any ties deterministically
                ROW_NUMBER() OVER (
                    PARTITION BY mp_inner.PersonID
                    ORDER BY oh.OrderDate DESC, oh.ID DESC
                )                                             AS rn

            FROM [morecheese_members].vwMemberProfiles mp_inner

                -- Join confirmed, non-refunded orders billed to the member
                INNER JOIN [__mj_BizAppsOrders].vwOrderHeaders oh
                    ON oh.BillToPersonID = mp_inner.PersonID
                    AND oh.Status = 'Confirmed'
                    AND oh.ReversesOrderHeaderID IS NULL
                    AND NOT EXISTS (
                        SELECT 1
                        FROM [__mj_BizAppsOrders].vwOrderHeaders oh2
                        WHERE oh2.ReversesOrderHeaderID = oh.ID
                          AND oh2.Status = 'Confirmed'
                    )

                -- Join non-refunded order lines
                INNER JOIN [__mj_BizAppsOrders].vwOrderLines ol
                    ON ol.OrderHeaderID = oh.ID
                    AND ol.ReversesOrderLineID IS NULL

                -- Join qualifying annual membership products
                INNER JOIN [__mj_BizAppsOrders].vwProducts pr
                    ON pr.ID = ol.ProductID
                    AND pr.Name LIKE '% Membership (annual)'

            -- Optional filters, repeated here so only the selected members' orders are aggregated
            WHERE 1 = 1
            {% if PersonID %}  AND mp_inner.PersonID = {{ PersonID | sqlString }}{% endif %}
            {% if OrganizationID %}  AND mp_inner.OrganizationID = {{ OrganizationID | sqlString }}{% endif %}
        ) q
        GROUP BY
            q.PersonID
    ) pa
        ON pa.PersonID = mp.PersonID

-- Optional filters: one member, or one organization's staff
WHERE 1 = 1
{% if PersonID %}  AND mp.PersonID = {{ PersonID | sqlString }}{% endif %}
{% if OrganizationID %}  AND mp.OrganizationID = {{ OrganizationID | sqlString }}{% endif %}

ORDER BY
    mp.MemberNumber ASC
