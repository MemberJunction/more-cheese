-- ============================================================
-- Organizations with Staff Members & Active Member Count
-- Returns every organization that employs at least one staff member,
-- including organization name, street address lines, city, state/province,
-- postal code, country, geocoded latitude/longitude coordinates, total staff
-- count, and the count of staff members who are currently active members.
-- Params: (none)
-- ============================================================
WITH ActiveMemberships AS (
    -- Qualifying membership purchases within trailing 12 months with no confirmed refund
    SELECT DISTINCT
        oh.BillToPersonID                                               AS PersonID
    FROM [__mj_BizAppsOrders].vwOrderHeaders oh
    INNER JOIN [__mj_BizAppsOrders].vwOrderLines ol
        ON ol.OrderHeaderID = oh.ID
    INNER JOIN [__mj_BizAppsOrders].vwProducts p
        ON p.ID = ol.ProductID
    WHERE
        oh.Status = 'Confirmed'
        AND oh.ReversesOrderHeaderID IS NULL
        AND p.Name LIKE '% Membership (annual)'
        AND oh.OrderDate >= DATEADD(MONTH, -12, '2026-10-08')
        AND NOT EXISTS (
            SELECT 1
            FROM [__mj_BizAppsOrders].vwOrderHeaders ref
            WHERE ref.ReversesOrderHeaderID = oh.ID
              AND ref.Status = 'Confirmed'
        )
)
SELECT
    org.ID                                                              AS OrganizationID,
    org.Name                                                            AS OrganizationName,

    -- Primary physical address fields
    org.PrimaryAddressLine1                                             AS StreetAddress,
    org.PrimaryAddressLine2                                             AS StreetAddress2,
    org.PrimaryAddressCity                                              AS City,
    org.PrimaryAddressState                                             AS StateProvince,
    org.PrimaryAddressPostalCode                                        AS PostalCode,
    org.PrimaryAddressCountry                                           AS Country,

    -- Prefer primary physical address coordinates, fallback to virtual geocode fields
    COALESCE(org.PrimaryAddressLatitude, org.__mj_Latitude)             AS Latitude,
    COALESCE(org.PrimaryAddressLongitude, org.__mj_Longitude)           AS Longitude,

    -- Count of current distinct staff members employed by the organization
    COUNT(DISTINCT r.FromPersonID)                                      AS StaffCount,

    -- Count of staff members holding an active qualifying membership
    COUNT(DISTINCT m.PersonID)                                          AS ActiveMemberCount

FROM [__mj_BizAppsCommon].vwOrganizations org

    -- Link to open employee relationships
    INNER JOIN [__mj_BizAppsCommon].vwRelationships r
        ON r.ToOrganizationID = org.ID
        AND r.RelationshipType = 'Employee'
        AND r.EndDate IS NULL

    -- Left join active membership status for each employee
    LEFT JOIN ActiveMemberships m
        ON m.PersonID = r.FromPersonID

GROUP BY
    org.ID,
    org.Name,
    org.PrimaryAddressLine1,
    org.PrimaryAddressLine2,
    org.PrimaryAddressCity,
    org.PrimaryAddressState,
    org.PrimaryAddressPostalCode,
    org.PrimaryAddressCountry,
    COALESCE(org.PrimaryAddressLatitude, org.__mj_Latitude),
    COALESCE(org.PrimaryAddressLongitude, org.__mj_Longitude)

HAVING
    COUNT(DISTINCT r.FromPersonID) >= 1                                 -- At least one staff member

ORDER BY
    ActiveMemberCount DESC,
    StaffCount DESC,
    org.Name ASC
