-- Migration: Add trips and trip_orders tables
-- Description: Create tables for managing delivery trips with multiple orders
-- Date: 2026-04-02

USE payoffsolar;

-- Drop existing tables if they exist (to recreate with correct collation)
DROP TABLE IF EXISTS trip_orders;
DROP TABLE IF EXISTS trips;

-- Create trips table with correct collation
CREATE TABLE IF NOT EXISTS trips (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()) COLLATE utf8mb4_general_ci,
  name VARCHAR(200) NOT NULL COLLATE utf8mb4_general_ci,
  description TEXT COLLATE utf8mb4_general_ci,
  trip_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'planned' COLLATE utf8mb4_general_ci,
  created_by VARCHAR(36) COLLATE utf8mb4_general_ci,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_trips_created_by (created_by),
  INDEX idx_trips_trip_date (trip_date),
  INDEX idx_trips_status (status)
) COLLATE=utf8mb4_general_ci;

-- Create trip_orders junction table to link orders to trips
CREATE TABLE IF NOT EXISTS trip_orders (
  id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()) COLLATE utf8mb4_general_ci,
  trip_id VARCHAR(36) NOT NULL COLLATE utf8mb4_general_ci,
  order_id VARCHAR(36) NOT NULL COLLATE utf8mb4_general_ci,
  sequence_order INT NOT NULL DEFAULT 0,
  notes TEXT COLLATE utf8mb4_general_ci,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_trip_order (trip_id, order_id),
  INDEX idx_trip_orders_trip_id (trip_id),
  INDEX idx_trip_orders_order_id (order_id),
  INDEX idx_trip_orders_sequence (trip_id, sequence_order)
) COLLATE=utf8mb4_general_ci;
