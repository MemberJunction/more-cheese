-- =============================================================================
-- Migration: V202609031400__v1.0.0_Wipe_MoreCheese_Orders_Schema.sql
-- Description: Completely wipes and retires morecheese_orders schema and tables.
-- Commercial primitives (Products, Orders, Order Lines, Payments) have migrated
-- to upstream @mj-biz-apps/orders (__mj_BizAppsOrders).
-- =============================================================================

-- 1. Drop Foreign Key Constraints
IF OBJECT_ID('morecheese_orders.FK_OrderLine_Product', 'F') IS NOT NULL
    ALTER TABLE [morecheese_orders].[OrderLine] DROP CONSTRAINT [FK_OrderLine_Product];

IF OBJECT_ID('morecheese_orders.FK_Order_Person', 'F') IS NOT NULL
    ALTER TABLE [morecheese_orders].[Order] DROP CONSTRAINT [FK_Order_Person];

IF OBJECT_ID('morecheese_orders.FK_OrderLine_Order', 'F') IS NOT NULL
    ALTER TABLE [morecheese_orders].[OrderLine] DROP CONSTRAINT [FK_OrderLine_Order];

IF OBJECT_ID('morecheese_orders.FK_Payment_Order', 'F') IS NOT NULL
    ALTER TABLE [morecheese_orders].[Payment] DROP CONSTRAINT [FK_Payment_Order];
GO

-- 2. Drop Stored Procedures
DROP PROCEDURE IF EXISTS [morecheese_orders].[spCreatePayment];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spUpdatePayment];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spDeletePayment];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spCreateOrder];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spUpdateOrder];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spDeleteOrder];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spCreateOrderLine];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spUpdateOrderLine];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spDeleteOrderLine];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spCreateProduct];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spUpdateProduct];
DROP PROCEDURE IF EXISTS [morecheese_orders].[spDeleteProduct];
GO

-- 3. Drop Views
DROP VIEW IF EXISTS [morecheese_orders].[vwPayments];
DROP VIEW IF EXISTS [morecheese_orders].[vwOrderLines];
DROP VIEW IF EXISTS [morecheese_orders].[vwOrders];
DROP VIEW IF EXISTS [morecheese_orders].[vwProducts];
GO

-- 4. Drop Tables
DROP TABLE IF EXISTS [morecheese_orders].[Payment];
DROP TABLE IF EXISTS [morecheese_orders].[OrderLine];
DROP TABLE IF EXISTS [morecheese_orders].[Order];
DROP TABLE IF EXISTS [morecheese_orders].[Product];
GO

-- 5. Delete MemberJunction Entity Registrations for morecheese_orders
UPDATE [__mj_BizAppsSonar].[ModelRelatedEntity] 
SET RelatedEntityID = 'fc529bc8-ff09-44a9-b454-26eafdac791b'
WHERE RelatedEntityID IN (SELECT ID FROM [__mj].[Entity] WHERE SchemaName = 'morecheese_orders');

UPDATE [__mj_BizAppsSonar].[Factor]
SET SourceEntityID = 'fc529bc8-ff09-44a9-b454-26eafdac791b'
WHERE SourceEntityID IN (SELECT ID FROM [__mj].[Entity] WHERE SchemaName = 'morecheese_orders');

UPDATE [__mj_BizAppsIssues].[Issue]
SET SourceEntityID = 'fc529bc8-ff09-44a9-b454-26eafdac791b'
WHERE SourceEntityID IN (SELECT ID FROM [__mj].[Entity] WHERE SchemaName = 'morecheese_orders');

DECLARE @eId UNIQUEIDENTIFIER;
DECLARE cur CURSOR LOCAL FAST_FORWARD FOR
    SELECT ID FROM [__mj].[Entity] WHERE SchemaName = 'morecheese_orders';

OPEN cur;
FETCH NEXT FROM cur INTO @eId;
WHILE @@FETCH_STATUS = 0
BEGIN
    EXEC [__mj].[spDeleteEntityWithCoreDependencies] @EntityID = @eId;
    FETCH NEXT FROM cur INTO @eId;
END;
CLOSE cur;
DEALLOCATE cur;
GO

-- 6. Drop Schema
IF SCHEMA_ID('morecheese_orders') IS NOT NULL
    DROP SCHEMA [morecheese_orders];
GO
