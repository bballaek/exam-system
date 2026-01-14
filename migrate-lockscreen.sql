-- Migration script to add lockScreen field to ExamSet table
-- Run this SQL script in your database

ALTER TABLE "ExamSet" 
ADD COLUMN IF NOT EXISTS "lockScreen" BOOLEAN NOT NULL DEFAULT false;




