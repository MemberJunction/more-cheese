-- ============================================================
-- Active Association Members with Geographic Coordinates and Organization
-- Returns all currently active members with their name, email, address,
-- geographic coordinates, and organization name.
-- Active status is defined as having a Confirmed, non-refunded
-- annual membership order in the trailing 12-month window
-- (the same definition as the Membership Status query's "Current").
-- Params: (none)
-- ============================================================
WITH ActiveMembership AS (
    -- Identify the latest qualifying membership order per person
    SELECT
        oh.BillToPersonID                        AS PersonID,
        MAX(oh.OrderDate)                        AS LatestOrderDate
    FROM [__mj_BizAppsOrders].vwOrderHeaders oh
        INNER JOIN [__mj_BizAppsOrders].vwOrderLines ol
            ON ol.OrderHeaderID = oh.ID
        INNER JOIN [__mj_BizAppsOrders].vwProducts pr
            ON pr.ID = ol.ProductID
    WHERE
        oh.Status = 'Confirmed'
        AND oh.ReversesOrderHeaderID IS NULL
        AND ol.ReversesOrderLineID IS NULL
        AND pr.Name LIKE '% Membership (annual)'
        AND NOT EXISTS (
            -- Exclude orders that have been refunded by a confirmed reversal order
            SELECT 1
            FROM [__mj_BizAppsOrders].vwOrderHeaders ref
            WHERE ref.ReversesOrderHeaderID = oh.ID
              AND ref.Status = 'Confirmed'
        )
    GROUP BY
        oh.BillToPersonID
    HAVING
        -- Active window: qualifying purchase within the trailing 12 months (inclusive)
        MAX(oh.OrderDate) >= DATEADD(YEAR, -1, CAST(GETDATE() AS DATE))
)
SELECT
    p.DisplayName                                AS MemberName,
    p.Email                                      AS Email,
    mp.MemberNumber                              AS MemberNumber,
    mp.Segment                                   AS MemberSegment,
    mp.AddressLine1                              AS AddressLine1,
    mp.AddressLine2                              AS AddressLine2,
    mp.City                                      AS City,
    mp.State                                     AS StateProvince,
    mp.PostalCode                                AS PostalCode,
    mp.CountryName                               AS Country,
    mp.Latitude                                  AS Latitude,
    mp.Longitude                                 AS Longitude,
    DATEADD(YEAR, 1, m.LatestOrderDate)          AS MembershipExpiryDate,
    mp.Organization                              AS OrganizationName
FROM ActiveMembership m
    INNER JOIN [morecheese_members].vwMemberProfiles mp
        ON mp.PersonID = m.PersonID
    INNER JOIN [__mj_BizAppsCommon].vwPeople p
        ON p.ID = m.PersonID
ORDER BY
    p.DisplayName ASC
