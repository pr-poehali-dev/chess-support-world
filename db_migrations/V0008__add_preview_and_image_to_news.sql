ALTER TABLE news 
ADD COLUMN preview TEXT,
ADD COLUMN image_url VARCHAR(500);

UPDATE news SET preview = content WHERE preview IS NULL;