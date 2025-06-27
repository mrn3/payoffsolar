-- Migration: Populate slugs for existing products
-- Date: 2025-06-27
-- Description: Generate slugs for existing products based on their names and SKUs

-- This script will be run after the add_slug_to_products.sql migration
-- It generates slugs for all existing products that don't have one

-- Note: This is a data migration that should be run manually or through a script
-- The slug generation logic matches the generateProductSlug function in TypeScript

-- Update products with generated slugs
-- This uses MySQL's LOWER, REPLACE, and REGEXP_REPLACE functions to create URL-friendly slugs
UPDATE products 
SET slug = CONCAT(
  -- Clean the product name
  LOWER(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(name, ' ', '-'),
                      '&', 'and'
                    ),
                    '/', '-'
                  ),
                  '\\', '-'
                ),
                '(', ''
              ),
              ')', ''
            ),
            '[', ''
          ),
          ']', ''
        ),
        '{', ''
      ),
      '}', ''
    )
  ),
  '-',
  -- Clean the SKU
  LOWER(
    REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(
            REPLACE(
              REPLACE(
                REPLACE(
                  REPLACE(
                    REPLACE(
                      REPLACE(sku, ' ', '-'),
                      '&', 'and'
                    ),
                    '/', '-'
                  ),
                  '\\', '-'
                ),
                '(', ''
              ),
              ')', ''
            ),
            '[', ''
          ),
          ']', ''
        ),
        '{', ''
      ),
      '}', ''
    )
  )
)
WHERE slug IS NULL OR slug = '';

-- Clean up any double hyphens and leading/trailing hyphens
UPDATE products 
SET slug = TRIM(BOTH '-' FROM REPLACE(REPLACE(REPLACE(slug, '--', '-'), '--', '-'), '--', '-'))
WHERE slug IS NOT NULL;

-- Handle any potential duplicates by appending a number
-- This is a simplified approach - in production you might want more sophisticated handling
SET @row_number = 0;
UPDATE products p1
JOIN (
  SELECT id, slug, 
    @row_number := CASE 
      WHEN @prev_slug = slug THEN @row_number + 1 
      ELSE 1 
    END AS rn,
    @prev_slug := slug
  FROM products 
  WHERE slug IS NOT NULL
  ORDER BY slug, created_at
) p2 ON p1.id = p2.id
SET p1.slug = CASE 
  WHEN p2.rn > 1 THEN CONCAT(p1.slug, '-', p2.rn)
  ELSE p1.slug
END;
