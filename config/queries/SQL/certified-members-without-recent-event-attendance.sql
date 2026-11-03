-- ============================================================
-- Certified Members Without Recent Event Attendance
-- Members who earned a certification in the trailing 2 years
-- (AwardedOn >= DATEADD(year, -2, CAST(GETDATE() AS date))) and have NOT
-- attended any federation event in the past 12 months
-- (OrderDate >= DATEADD(month, -12, CAST(GETDATE() AS date))).
-- Params: (none)
-- ============================================================
WITH MemberCerts AS (
    SELECT
        mc.PersonID,
        COUNT(CASE WHEN mc.AwardedOn IS NOT NULL THEN 1 END) AS TotalCertificationsEarned,
        MAX(CASE WHEN mc.AwardedOn >= DATEADD(year, -2, CAST(GETDATE() AS date)) THEN 1 ELSE 0 END) AS HasRecentCert
    FROM [morecheese_learning].vwMemberCertifications mc
    WHERE mc.AwardedOn IS NOT NULL
    GROUP BY mc.PersonID
),
RankedCerts AS (
    SELECT
        mc.PersonID,
        c.Name AS CertificationName,
        mc.AwardedOn,
        ROW_NUMBER() OVER (
            PARTITION BY mc.PersonID
            ORDER BY mc.AwardedOn DESC
        ) AS RowNum
    FROM [morecheese_learning].vwMemberCertifications mc
    INNER JOIN [morecheese_learning].vwCertifications c
        ON mc.CertificationID = c.ID
    WHERE mc.AwardedOn IS NOT NULL
),
RecentEventAttendees AS (
    SELECT DISTINCT
        eol.PersonID
    FROM [__mj_BizAppsOrders].vwEventOrderLines eol
    INNER JOIN [__mj_BizAppsOrders].vwOrderHeaders oh
        ON eol.OrderHeaderID = oh.ID
    WHERE eol.AttendanceStatus = 'Attended'
      AND oh.Status = 'Confirmed'
      AND oh.OrderDate >= DATEADD(month, -12, CAST(GETDATE() AS date))
)
SELECT
    p.ID                                      AS PersonID,
    p.FirstName + ' ' + p.LastName            AS MemberName,
    p.Email                                   AS Email,
    mp.Region                                 AS Region,
    mc.TotalCertificationsEarned              AS TotalCertificationsEarned,
    rc.CertificationName                      AS MostRecentCertificationName,
    rc.AwardedOn                              AS MostRecentCertificationDate
FROM MemberCerts mc
INNER JOIN [__mj_BizAppsCommon].vwPeople p
    ON mc.PersonID = p.ID
INNER JOIN [morecheese_members].vwMemberProfiles mp
    ON mc.PersonID = mp.PersonID
INNER JOIN RankedCerts rc
    ON mc.PersonID = rc.PersonID
   AND rc.RowNum = 1
LEFT JOIN RecentEventAttendees rea
    ON mc.PersonID = rea.PersonID
WHERE mc.HasRecentCert = 1
  AND rea.PersonID IS NULL
ORDER BY
    rc.AwardedOn DESC
