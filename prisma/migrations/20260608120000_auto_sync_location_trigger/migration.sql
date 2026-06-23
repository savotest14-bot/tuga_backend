-- Create trigger function to automatically update geography Point
CREATE OR REPLACE FUNCTION update_user_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude::double precision, NEW.latitude::double precision), 4326)::geography;
  ELSE
    NEW.location = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on User table
DROP TRIGGER IF EXISTS user_location_trigger ON "User";
CREATE TRIGGER user_location_trigger
BEFORE INSERT OR UPDATE OF latitude, longitude ON "User"
FOR EACH ROW
EXECUTE FUNCTION update_user_location();

-- Create spatial index
CREATE INDEX IF NOT EXISTS "User_location_gist" ON "User" USING GIST ("location");
