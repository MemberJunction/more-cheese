-- ============================================================
-- Member Event Attendance
-- Category: Skip/Members/Activity
-- Reusable: true
-- Returns member event attendance records with parsed event
-- metadata, attendance statuses, attendee contact details, and derived outcomes.
-- Params: (none)
-- ============================================================
SELECT
    eol.ID                                                      AS EventRegistrationID,
    eol.PersonID                                                AS PersonID,
    mp.ID                                                       AS MemberProfileID,
    mp.MemberNumber                                             AS MemberNumber,
    pe.DisplayName                                              AS AttendeeName,
    pe.Email                                                    AS AttendeeEmail,
    mp.Region                                                   AS Region,
    mp.Segment                                                  AS Segment,
    pr.Name                                                     AS EventProduct,

    -- Extract 4-digit event year from order number pattern -EVT-YYYY-
    TRY_CAST(SUBSTRING(oh.OrderNumber, PATINDEX('%-EVT-[0-9][0-9][0-9][0-9]-%', oh.OrderNumber) + 5, 4) AS int) AS EventYear,

    -- Extract event code from trailing suffix of order number (e.g. CONF, W1..W5)
    RIGHT(oh.OrderNumber, CHARINDEX('-', REVERSE(oh.OrderNumber)) - 1) AS EventCode,

    -- Construct human-readable event title
    CASE 
        WHEN RIGHT(oh.OrderNumber, CHARINDEX('-', REVERSE(oh.OrderNumber)) - 1) = 'CONF' 
        THEN 'Annual Conference ' + CAST(TRY_CAST(SUBSTRING(oh.OrderNumber, PATINDEX('%-EVT-[0-9][0-9][0-9][0-9]-%', oh.OrderNumber) + 5, 4) AS int) AS varchar(10))
        ELSE 'Workshop ' + RIGHT(oh.OrderNumber, CHARINDEX('-', REVERSE(oh.OrderNumber)) - 1) + ' ' + CAST(TRY_CAST(SUBSTRING(oh.OrderNumber, PATINDEX('%-EVT-[0-9][0-9][0-9][0-9]-%', oh.OrderNumber) + 5, 4) AS int) AS varchar(10))
    END                                                         AS EventName,

    -- Derive conference event date from year and product start month/day; workshop dates are NULL
    CASE 
        WHEN RIGHT(oh.OrderNumber, CHARINDEX('-', REVERSE(oh.OrderNumber)) - 1) = 'CONF' 
        THEN DATEFROMPARTS(TRY_CAST(SUBSTRING(oh.OrderNumber, PATINDEX('%-EVT-[0-9][0-9][0-9][0-9]-%', oh.OrderNumber) + 5, 4) AS int), MONTH(ep.EventStartsAt), DAY(ep.EventStartsAt))
        ELSE NULL 
    END                                                         AS EventDate,

    ep.EventFormat                                              AS EventFormat,
    ep.VenueName                                                AS VenueName,
    oh.OrderNumber                                              AS OrderNumber,
    oh.OrderDate                                                AS RegisteredOn,
    eol.TicketTier                                              AS TicketTier,
    eol.AttendanceStatus                                        AS AttendanceStatus,

    -- Classify status into Attended, No Show, Cancelled, Upcoming, or Not Recorded
    CASE 
        WHEN eol.AttendanceStatus IN ('Attended', 'No Show', 'Cancelled') THEN eol.AttendanceStatus
        WHEN (TRY_CAST(SUBSTRING(oh.OrderNumber, PATINDEX('%-EVT-[0-9][0-9][0-9][0-9]-%', oh.OrderNumber) + 5, 4) AS int) > YEAR(GETUTCDATE())) 
             OR (TRY_CAST(SUBSTRING(oh.OrderNumber, PATINDEX('%-EVT-[0-9][0-9][0-9][0-9]-%', oh.OrderNumber) + 5, 4) AS int) = YEAR(GETUTCDATE()) AND ep.EventStartsAt > GETUTCDATE())
        THEN 'Upcoming'
        ELSE 'Not Recorded'
    END                                                         AS AttendanceOutcome,

    -- Binary attendance flag (1 if confirmed attended, 0 otherwise)
    CASE 
        WHEN eol.AttendanceStatus = 'Attended' THEN 1 
        ELSE 0     END                                                         AS Attended

FROM [__mj_BizAppsOrders].vwEventOrderLines eol

    -- Join base order line
    INNER JOIN [__mj_BizAppsOrders].vwOrderLines ol
        ON ol.ID = eol.ID

    -- Join order header for order number, date, and status
    INNER JOIN [__mj_BizAppsOrders].vwOrderHeaders oh
        ON oh.ID = ol.OrderHeaderID

    -- Join base product definition
    INNER JOIN [__mj_BizAppsOrders].vwProducts pr
        ON pr.ID = ol.ProductID

    -- Restrict strictly to event products (drops non-event order lines)
    INNER JOIN [__mj_BizAppsOrders].vwEventProducts ep
        ON ep.ID = pr.ID

    -- Join person record representing the actual attendee
    INNER JOIN [__mj_BizAppsCommon].vwPeople pe
        ON pe.ID = eol.PersonID

    -- Join member profile for membership details
    INNER JOIN [morecheese_members].vwMemberProfiles mp
        ON mp.PersonID = eol.PersonID

WHERE
    oh.Status = 'Confirmed'                                     -- Confirmed orders only
    AND oh.ReversesOrderHeaderID IS NULL                        -- Not a reversal header
    AND ol.ReversesOrderLineID IS NULL                          -- Not a reversal line
    AND NOT EXISTS (                                            -- No confirmed reversal against this header
        SELECT 1 
        FROM [__mj_BizAppsOrders].vwOrderHeaders r 
        WHERE r.ReversesOrderHeaderID = oh.ID 
          AND r.Status = 'Confirmed'
    )

ORDER BY
    EventYear DESC,
    RegisteredOn DESC
