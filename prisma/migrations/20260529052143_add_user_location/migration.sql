CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE "User"
ADD COLUMN "addressLine" TEXT,
ADD COLUMN "city" TEXT,
ADD COLUMN "state" TEXT,
ADD COLUMN "country" TEXT,
ADD COLUMN "postalCode" TEXT,
ADD COLUMN "latitude" DECIMAL(10,7),
ADD COLUMN "longitude" DECIMAL(10,7),
ADD COLUMN "location" geography(Point, 4326);

CREATE INDEX "user_location_idx"
ON "User"
USING GIST ("location");