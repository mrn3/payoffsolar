const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function addContentBlocksTables() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'payoffsolar'
  });

  try {
    console.log('Starting content blocks tables migration...');

    // Create block_types table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS block_types (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        name VARCHAR(50) NOT NULL UNIQUE,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        icon VARCHAR(50),
        schema_config JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Created block_types table');

    // Create content_blocks table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS content_blocks (
        id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
        content_id VARCHAR(36) NOT NULL,
        block_type_id VARCHAR(36) NOT NULL,
        block_order INT NOT NULL DEFAULT 0,
        configuration JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES content(id) ON DELETE CASCADE,
        FOREIGN KEY (block_type_id) REFERENCES block_types(id),
        INDEX idx_content_blocks_content_order (content_id, block_order)
      )
    `);
    console.log('✓ Created content_blocks table');

    // Insert default block types
    await connection.execute(`
      INSERT IGNORE INTO block_types (id, name, display_name, description, icon, schema_config) VALUES
      (UUID(), 'hero', 'Hero Block', 'Large banner with title, subtitle, and background image', 'FaImage', JSON_OBJECT(
        'properties', JSON_OBJECT(
          'title', JSON_OBJECT('type', 'string', 'required', true),
          'subtitle', JSON_OBJECT('type', 'string', 'required', false),
          'backgroundImage', JSON_OBJECT('type', 'string', 'required', false),
          'textAlign', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('left', 'center', 'right'), 'default', 'center')
        )
      )),
      (UUID(), 'card_grid', 'Card Grid', 'Grid of cards with images, titles, and descriptions', 'FaTh', JSON_OBJECT(
        'properties', JSON_OBJECT(
          'title', JSON_OBJECT('type', 'string', 'required', false),
          'subtitle', JSON_OBJECT('type', 'string', 'required', false),
          'columns', JSON_OBJECT('type', 'number', 'min', 1, 'max', 4, 'default', 3),
          'cards', JSON_OBJECT('type', 'array', 'items', JSON_OBJECT(
            'type', 'object',
            'properties', JSON_OBJECT(
              'image', JSON_OBJECT('type', 'string', 'required', false),
              'title', JSON_OBJECT('type', 'string', 'required', true),
              'description', JSON_OBJECT('type', 'string', 'required', false),
              'link', JSON_OBJECT('type', 'string', 'required', false),
              'linkText', JSON_OBJECT('type', 'string', 'required', false)
            )
          ))
        )
      )),
      (UUID(), 'text_block', 'Text Block', 'Rich text content block', 'FaAlignLeft', JSON_OBJECT(
        'properties', JSON_OBJECT(
          'content', JSON_OBJECT('type', 'string', 'format', 'html', 'required', true),
          'textAlign', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('left', 'center', 'right'), 'default', 'left')
        )
      )),
      (UUID(), 'image_block', 'Image Block', 'Single image with optional caption', 'FaImage', JSON_OBJECT(
        'properties', JSON_OBJECT(
          'image', JSON_OBJECT('type', 'string', 'required', true),
          'caption', JSON_OBJECT('type', 'string', 'required', false),
          'alt', JSON_OBJECT('type', 'string', 'required', false),
          'size', JSON_OBJECT('type', 'string', 'enum', JSON_ARRAY('small', 'medium', 'large', 'full'), 'default', 'medium')
        )
      )),
      (UUID(), 'video_block', 'Video Block', 'Embedded video content', 'FaVideo', JSON_OBJECT(
        'properties', JSON_OBJECT(
          'url', JSON_OBJECT('type', 'string', 'required', true),
          'title', JSON_OBJECT('type', 'string', 'required', false),
          'description', JSON_OBJECT('type', 'string', 'required', false),
          'autoplay', JSON_OBJECT('type', 'boolean', 'default', false)
        )
      ))
    `);
    console.log('✓ Inserted default block types');

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  addContentBlocksTables().catch(console.error);
}

module.exports = addContentBlocksTables;
