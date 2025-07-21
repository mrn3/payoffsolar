import { Contact, OrderWithContact, OrderWithItems, ProductWithFirstImage, Product, Order } from '@/lib/types';

export interface DuplicateGroup {
  id: string;
  contacts: Contact[];
  similarityScore: number;
  matchType: 'email' | 'phone' | 'name' | 'multiple';
}

export interface ContactSimilarity {
  contact1: Contact;
  contact2: Contact;
  similarityScore: number;
  matchReasons: string[];
}

export interface OrderDuplicateGroup {
  id: string;
  orders: OrderWithContact[];
  similarityScore: number;
  matchType: 'total' | 'contact' | 'date' | 'status' | 'multiple';
}

export interface OrderSimilarity {
  order1: OrderWithContact;
  order2: OrderWithContact;
  similarityScore: number;
  matchReasons: string[];
}

export interface ProductDuplicateGroup {
  id: string;
  products: ProductWithFirstImage[];
  similarityScore: number;
  matchType: 'name' | 'sku' | 'price' | 'description' | 'multiple';
}

export interface ProductSimilarity {
  product1: ProductWithFirstImage;
  product2: ProductWithFirstImage;
  similarityScore: number;
  matchReasons: string[];
}

// Smart merge utility functions
export function isBlankValue(value: any): boolean {
  return value === null || value === undefined || value === '' || (typeof value === 'string' && value.trim() === '');
}

export function getMostRecentRecord<T extends { updated_at: string }>(record1: T, record2: T): T {
  const date1 = new Date(record1.updated_at);
  const date2 = new Date(record2.updated_at);
  return date1 >= date2 ? record1 : record2;
}

export function getEarliestCreatedRecord<T extends { created_at: string }>(record1: T, record2: T): T {
  const date1 = new Date(record1.created_at);
  const date2 = new Date(record2.created_at);
  return date1 <= date2 ? record1 : record2;
}

export function smartMergeContacts(contact1: Contact, contact2: Contact): Omit<Contact, 'id' | 'updated_at'> {
  const mostRecent = getMostRecentRecord(contact1, contact2);
  const earliest = getEarliestCreatedRecord(contact1, contact2);
  const other = mostRecent === contact1 ? contact2 : contact1;

  // For notes, combine both if they're different and both have content
  let mergedNotes = '';
  const notes1 = contact1.notes?.trim() || '';
  const notes2 = contact2.notes?.trim() || '';

  if (notes1 && notes2 && notes1 !== notes2) {
    mergedNotes = `${notes1}\n\n${notes2}`;
  } else if (notes1) {
    mergedNotes = notes1;
  } else if (notes2) {
    mergedNotes = notes2;
  }

  return {
    name: !isBlankValue(contact1.name) ? contact1.name :
          !isBlankValue(contact2.name) ? contact2.name : mostRecent.name,
    email: !isBlankValue(contact1.email) ? contact1.email :
           !isBlankValue(contact2.email) ? contact2.email : mostRecent.email,
    phone: !isBlankValue(contact1.phone) ? contact1.phone :
           !isBlankValue(contact2.phone) ? contact2.phone : mostRecent.phone,
    address: !isBlankValue(contact1.address) ? contact1.address :
             !isBlankValue(contact2.address) ? contact2.address : mostRecent.address,
    city: !isBlankValue(contact1.city) ? contact1.city :
          !isBlankValue(contact2.city) ? contact2.city : mostRecent.city,
    state: !isBlankValue(contact1.state) ? contact1.state :
           !isBlankValue(contact2.state) ? contact2.state : mostRecent.state,
    zip: !isBlankValue(contact1.zip) ? contact1.zip :
         !isBlankValue(contact2.zip) ? contact2.zip : mostRecent.zip,
    notes: mergedNotes || null,
    user_id: !isBlankValue(contact1.user_id) ? contact1.user_id :
             !isBlankValue(contact2.user_id) ? contact2.user_id : mostRecent.user_id,
    created_at: earliest.created_at // Use the earliest created date
  };
}

export function smartMergeProducts(product1: Product, product2: Product): Omit<Product, 'id' | 'created_at' | 'updated_at'> {
  const mostRecent = getMostRecentRecord(product1, product2);
  const other = mostRecent === product1 ? product2 : product1;

  return {
    name: !isBlankValue(product1.name) ? product1.name :
          !isBlankValue(product2.name) ? product2.name : mostRecent.name,
    description: !isBlankValue(product1.description) ? product1.description :
                 !isBlankValue(product2.description) ? product2.description : mostRecent.description,
    price: product1.price !== 0 ? product1.price :
           product2.price !== 0 ? product2.price : mostRecent.price,
    image_url: !isBlankValue(product1.image_url) ? product1.image_url :
               !isBlankValue(product2.image_url) ? product2.image_url : mostRecent.image_url,
    data_sheet_url: !isBlankValue(product1.data_sheet_url) ? product1.data_sheet_url :
                    !isBlankValue(product2.data_sheet_url) ? product2.data_sheet_url : mostRecent.data_sheet_url,
    category_id: !isBlankValue(product1.category_id) ? product1.category_id :
                 !isBlankValue(product2.category_id) ? product2.category_id : mostRecent.category_id,
    sku: !isBlankValue(product1.sku) ? product1.sku :
         !isBlankValue(product2.sku) ? product2.sku : mostRecent.sku,
    is_active: mostRecent.is_active // For boolean, use most recent
  };
}

export function smartMergeOrders(order1: Order, order2: Order): Omit<Order, 'id' | 'created_at' | 'updated_at'> {
  const mostRecent = getMostRecentRecord(order1, order2);
  const other = mostRecent === order1 ? order2 : order1;

  return {
    contact_id: !isBlankValue(order1.contact_id) ? order1.contact_id :
                !isBlankValue(order2.contact_id) ? order2.contact_id : mostRecent.contact_id,
    status: !isBlankValue(order1.status) ? order1.status :
            !isBlankValue(order2.status) ? order2.status : mostRecent.status,
    total: (typeof order1.total === 'number' && order1.total !== 0) ? order1.total :
           (typeof order2.total === 'number' && order2.total !== 0) ? order2.total : mostRecent.total,
    order_date: !isBlankValue(order1.order_date) ? order1.order_date :
                !isBlankValue(order2.order_date) ? order2.order_date : mostRecent.order_date,
    notes: !isBlankValue(order1.notes) ? order1.notes :
           !isBlankValue(order2.notes) ? order2.notes : mostRecent.notes
  };
}

// Calculate similarity between two strings using Levenshtein distance
function levenshteinDistance(str1: string, str2: string): number {
  const matrix = [];
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  // Initialize matrix
  for (let i = 0; i <= len2; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len1; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len2; i++) {
    for (let j = 1; j <= len1; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[len2][len1];
}

// Calculate string similarity percentage
function stringSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0;
  
  const normalizedStr1 = str1.toLowerCase().trim();
  const normalizedStr2 = str2.toLowerCase().trim();
  
  if (normalizedStr1 === normalizedStr2) return 100;
  
  const maxLength = Math.max(normalizedStr1.length, normalizedStr2.length);
  const distance = levenshteinDistance(normalizedStr1, normalizedStr2);
  
  return Math.max(0, (1 - distance / maxLength) * 100);
}

// Normalize phone number for comparison
function normalizePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

// Calculate similarity between two contacts
export function calculateContactSimilarity(contact1: Contact, contact2: Contact): ContactSimilarity {
  const matchReasons: string[] = [];
  let totalScore = 0;
  let scoreCount = 0;

  // Email match (highest priority)
  if (contact1.email && contact2.email) {
    const emailSimilarity = stringSimilarity(contact1.email, contact2.email);
    if (emailSimilarity === 100) {
      matchReasons.push('Exact email match');
      totalScore += 100;
    } else if (emailSimilarity > 80) {
      matchReasons.push('Similar email');
      totalScore += emailSimilarity;
    }
    scoreCount++;
  }

  // Phone match (high priority)
  if (contact1.phone && contact2.phone) {
    const phone1 = normalizePhone(contact1.phone);
    const phone2 = normalizePhone(contact2.phone);
    if (phone1 && phone2) {
      const phoneSimilarity = stringSimilarity(phone1, phone2);
      if (phoneSimilarity === 100) {
        matchReasons.push('Exact phone match');
        totalScore += 95;
      } else if (phoneSimilarity > 80) {
        matchReasons.push('Similar phone');
        totalScore += phoneSimilarity * 0.9;
      }
      scoreCount++;
    }
  }

  // Name match (medium priority)
  const fullName1 = contact1.name || '';
  const fullName2 = contact2.name || '';
  const nameSimilarity = stringSimilarity(fullName1, fullName2);
  
  if (nameSimilarity === 100) {
    matchReasons.push('Exact name match');
    totalScore += 80;
  } else if (nameSimilarity > 85) {
    matchReasons.push('Very similar name');
    totalScore += nameSimilarity * 0.8;
  } else if (nameSimilarity > 70) {
    matchReasons.push('Similar name');
    totalScore += nameSimilarity * 0.6;
  }
  scoreCount++;

  // Address match (lower priority)
  if (contact1.address && contact2.address && contact1.city && contact2.city) {
    const address1 = `${contact1.address} ${contact1.city}`.toLowerCase().trim();
    const address2 = `${contact2.address} ${contact2.city}`.toLowerCase().trim();
    const addressSimilarity = stringSimilarity(address1, address2);
    
    if (addressSimilarity > 90) {
      matchReasons.push('Same address');
      totalScore += addressSimilarity * 0.5;
      scoreCount++;
    }
  }

  const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

  return {
    contact1,
    contact2,
    similarityScore: Math.round(averageScore),
    matchReasons
  };
}

// Find potential duplicates in a list of contacts
export function findDuplicates(_contacts: Contact[], threshold = 70): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];
  const processedContacts = new Set<string>();

  for (let i = 0; i < _contacts.length; i++) {
    if (processedContacts.has(_contacts[i].id)) continue;

    const currentContact = _contacts[i];
    const similarContacts: Contact[] = [currentContact];
    let maxSimilarity = 0;
    const matchTypes = new Set<string>();

    for (let j = i + 1; j < _contacts.length; j++) {
      if (processedContacts.has(_contacts[j].id)) continue;

      const similarity = calculateContactSimilarity(currentContact, _contacts[j]);
      
      if (similarity.similarityScore >= threshold) {
        similarContacts.push(_contacts[j]);
        maxSimilarity = Math.max(maxSimilarity, similarity.similarityScore);
        
        // Determine match type
        if (similarity.matchReasons.some(_reason => _reason.includes('email'))) {
          matchTypes.add('email');
        }
        if (similarity.matchReasons.some(_reason => _reason.includes('phone'))) {
          matchTypes.add('phone');
        }
        if (similarity.matchReasons.some(_reason => _reason.includes('name'))) {
          matchTypes.add('name');
        }
      }
    }

    if (similarContacts.length > 1) {
      // Mark all contacts in this group as processed
      similarContacts.forEach(contact => processedContacts.add(contact.id));

      // Determine primary match type
      let primaryMatchType: 'email' | 'phone' | 'name' | 'multiple' = 'name';
      if (matchTypes.size > 1) {
        primaryMatchType = 'multiple';
      } else if (matchTypes.has('email')) {
        primaryMatchType = 'email';
      } else if (matchTypes.has('phone')) {
        primaryMatchType = 'phone';
      }

      duplicateGroups.push({
        id: `group-${duplicateGroups.length + 1}`,
        contacts: similarContacts,
        similarityScore: maxSimilarity,
        matchType: primaryMatchType
      });
    }
  }

  // Sort by similarity score (highest first)
  return duplicateGroups.sort((a, b) => b.similarityScore - a.similarityScore);
}

// Calculate similarity between two orders
export function calculateOrderSimilarity(order1: OrderWithContact, order2: OrderWithContact): OrderSimilarity {
  const matchReasons: string[] = [];
  let totalScore = 0;
  let scoreCount = 0;

  // Total amount match (highest priority)
  const total1 = Number(order1.total);
  const total2 = Number(order2.total);
  if (total1 === total2) {
    matchReasons.push('Exact total match');
    totalScore += 100;
    scoreCount++;
  } else if (Math.abs(total1 - total2) <= 0.01) {
    matchReasons.push('Very similar total');
    totalScore += 95;
    scoreCount++;
  } else {
    // Calculate percentage difference
    const avgTotal = (total1 + total2) / 2;
    const percentDiff = Math.abs(total1 - total2) / avgTotal * 100;
    if (percentDiff <= 5) {
      matchReasons.push('Similar total');
      totalScore += 85;
      scoreCount++;
    } else if (percentDiff <= 10) {
      matchReasons.push('Somewhat similar total');
      totalScore += 70;
      scoreCount++;
    }
  }

  // Contact name match (high priority)
  const contactName1 = order1.contact_name || '';
  const contactName2 = order2.contact_name || '';
  if (contactName1 && contactName2) {
    const nameSimilarity = stringSimilarity(contactName1, contactName2);
    if (nameSimilarity === 100) {
      matchReasons.push('Exact contact name match');
      totalScore += 90;
    } else if (nameSimilarity > 85) {
      matchReasons.push('Very similar contact name');
      totalScore += nameSimilarity * 0.85;
    } else if (nameSimilarity > 70) {
      matchReasons.push('Similar contact name');
      totalScore += nameSimilarity * 0.7;
    }
    scoreCount++;
  }

  // Order date match (medium priority)
  const date1 = new Date(order1.order_date);
  const date2 = new Date(order2.order_date);
  const daysDiff = Math.abs(date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);

  if (daysDiff === 0) {
    matchReasons.push('Same order date');
    totalScore += 80;
  } else if (daysDiff <= 1) {
    matchReasons.push('Order dates within 1 day');
    totalScore += 70;
  } else if (daysDiff <= 7) {
    matchReasons.push('Order dates within 1 week');
    totalScore += 60;
  } else if (daysDiff <= 30) {
    matchReasons.push('Order dates within 1 month');
    totalScore += 40;
  }
  scoreCount++;

  // Status match (lower priority)
  if (order1.status && order2.status) {
    const statusSimilarity = stringSimilarity(order1.status, order2.status);
    if (statusSimilarity === 100) {
      matchReasons.push('Same status');
      totalScore += 60;
    } else if (statusSimilarity > 80) {
      matchReasons.push('Similar status');
      totalScore += statusSimilarity * 0.5;
    }
    scoreCount++;
  }

  const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

  return {
    order1,
    order2,
    similarityScore: Math.round(averageScore),
    matchReasons
  };
}

// Find potential duplicate orders in a list of orders
export function findOrderDuplicates(orders: OrderWithContact[], threshold = 70): OrderDuplicateGroup[] {
  const duplicateGroups: OrderDuplicateGroup[] = [];
  const processedOrders = new Set<string>();

  for (let i = 0; i < orders.length; i++) {
    if (processedOrders.has(orders[i].id)) continue;

    const currentOrder = orders[i];
    const similarOrders: OrderWithContact[] = [currentOrder];
    let maxSimilarity = 0;
    const matchTypes = new Set<string>();

    for (let j = i + 1; j < orders.length; j++) {
      if (processedOrders.has(orders[j].id)) continue;

      const similarity = calculateOrderSimilarity(currentOrder, orders[j]);

      if (similarity.similarityScore >= threshold) {
        similarOrders.push(orders[j]);
        maxSimilarity = Math.max(maxSimilarity, similarity.similarityScore);

        // Determine match type
        if (similarity.matchReasons.some(reason => reason.includes('total'))) {
          matchTypes.add('total');
        }
        if (similarity.matchReasons.some(reason => reason.includes('contact'))) {
          matchTypes.add('contact');
        }
        if (similarity.matchReasons.some(reason => reason.includes('date'))) {
          matchTypes.add('date');
        }
        if (similarity.matchReasons.some(reason => reason.includes('status'))) {
          matchTypes.add('status');
        }
      }
    }

    if (similarOrders.length > 1) {
      // Mark all orders in this group as processed
      similarOrders.forEach(order => processedOrders.add(order.id));

      // Determine primary match type
      let primaryMatchType: 'total' | 'contact' | 'date' | 'status' | 'multiple' = 'total';
      if (matchTypes.size > 1) {
        primaryMatchType = 'multiple';
      } else if (matchTypes.has('total')) {
        primaryMatchType = 'total';
      } else if (matchTypes.has('contact')) {
        primaryMatchType = 'contact';
      } else if (matchTypes.has('date')) {
        primaryMatchType = 'date';
      } else if (matchTypes.has('status')) {
        primaryMatchType = 'status';
      }

      duplicateGroups.push({
        id: `group-${duplicateGroups.length + 1}`,
        orders: similarOrders,
        similarityScore: maxSimilarity,
        matchType: primaryMatchType
      });
    }
  }

  // Sort by similarity score (highest first)
  return duplicateGroups.sort((a, b) => b.similarityScore - a.similarityScore);
}

// Calculate similarity between two products
export function calculateProductSimilarity(product1: ProductWithFirstImage, product2: ProductWithFirstImage): ProductSimilarity {
  const matchReasons: string[] = [];
  let totalScore = 0;
  let scoreCount = 0;

  // SKU match (highest priority - should be unique)
  if (product1.sku && product2.sku) {
    const skuSimilarity = stringSimilarity(product1.sku, product2.sku);
    if (skuSimilarity === 100) {
      matchReasons.push('Exact SKU match');
      totalScore += 100;
    } else if (skuSimilarity > 90) {
      matchReasons.push('Very similar SKU');
      totalScore += skuSimilarity;
    } else if (skuSimilarity > 80) {
      matchReasons.push('Similar SKU');
      totalScore += skuSimilarity * 0.9;
    }
    scoreCount++;
  }

  // Name match (high priority)
  const nameSimilarity = stringSimilarity(product1.name, product2.name);
  if (nameSimilarity === 100) {
    matchReasons.push('Exact name match');
    totalScore += 95;
  } else if (nameSimilarity > 90) {
    matchReasons.push('Very similar name');
    totalScore += nameSimilarity * 0.9;
  } else if (nameSimilarity > 80) {
    matchReasons.push('Similar name');
    totalScore += nameSimilarity * 0.8;
  } else if (nameSimilarity > 70) {
    matchReasons.push('Somewhat similar name');
    totalScore += nameSimilarity * 0.6;
  }
  scoreCount++;

  // Price match (medium priority)
  const price1 = Number(product1.price);
  const price2 = Number(product2.price);
  if (price1 === price2) {
    matchReasons.push('Exact price match');
    totalScore += 85;
    scoreCount++;
  } else if (Math.abs(price1 - price2) <= 0.01) {
    matchReasons.push('Very similar price');
    totalScore += 80;
    scoreCount++;
  } else {
    // Calculate percentage difference
    const avgPrice = (price1 + price2) / 2;
    if (avgPrice > 0) {
      const percentDiff = Math.abs(price1 - price2) / avgPrice * 100;
      if (percentDiff <= 5) {
        matchReasons.push('Similar price');
        totalScore += 75;
        scoreCount++;
      } else if (percentDiff <= 10) {
        matchReasons.push('Somewhat similar price');
        totalScore += 65;
        scoreCount++;
      }
    }
  }

  // Description match (lower priority)
  if (product1.description && product2.description) {
    const descSimilarity = stringSimilarity(product1.description, product2.description);
    if (descSimilarity === 100) {
      matchReasons.push('Exact description match');
      totalScore += 70;
    } else if (descSimilarity > 85) {
      matchReasons.push('Very similar description');
      totalScore += descSimilarity * 0.6;
    } else if (descSimilarity > 70) {
      matchReasons.push('Similar description');
      totalScore += descSimilarity * 0.4;
    }
    scoreCount++;
  }

  const averageScore = scoreCount > 0 ? totalScore / scoreCount : 0;

  return {
    product1,
    product2,
    similarityScore: Math.round(averageScore),
    matchReasons
  };
}

// Find potential duplicate products in a list of products
export function findProductDuplicates(products: ProductWithFirstImage[], threshold = 70): ProductDuplicateGroup[] {
  const duplicateGroups: ProductDuplicateGroup[] = [];
  const processedProducts = new Set<string>();

  for (let i = 0; i < products.length; i++) {
    if (processedProducts.has(products[i].id)) continue;

    const currentProduct = products[i];
    const similarProducts: ProductWithFirstImage[] = [currentProduct];
    let maxSimilarity = 0;
    const matchTypes = new Set<string>();

    for (let j = i + 1; j < products.length; j++) {
      if (processedProducts.has(products[j].id)) continue;

      const similarity = calculateProductSimilarity(currentProduct, products[j]);

      if (similarity.similarityScore >= threshold) {
        similarProducts.push(products[j]);
        maxSimilarity = Math.max(maxSimilarity, similarity.similarityScore);

        // Determine match type
        if (similarity.matchReasons.some(reason => reason.includes('SKU'))) {
          matchTypes.add('sku');
        }
        if (similarity.matchReasons.some(reason => reason.includes('name'))) {
          matchTypes.add('name');
        }
        if (similarity.matchReasons.some(reason => reason.includes('price'))) {
          matchTypes.add('price');
        }
        if (similarity.matchReasons.some(reason => reason.includes('description'))) {
          matchTypes.add('description');
        }
      }
    }

    if (similarProducts.length > 1) {
      // Mark all products in this group as processed
      similarProducts.forEach(product => processedProducts.add(product.id));

      // Determine primary match type
      let primaryMatchType: 'name' | 'sku' | 'price' | 'description' | 'multiple' = 'name';
      if (matchTypes.size > 1) {
        primaryMatchType = 'multiple';
      } else if (matchTypes.has('sku')) {
        primaryMatchType = 'sku';
      } else if (matchTypes.has('name')) {
        primaryMatchType = 'name';
      } else if (matchTypes.has('price')) {
        primaryMatchType = 'price';
      } else if (matchTypes.has('description')) {
        primaryMatchType = 'description';
      }

      duplicateGroups.push({
        id: `group-${duplicateGroups.length + 1}`,
        products: similarProducts,
        similarityScore: maxSimilarity,
        matchType: primaryMatchType
      });
    }
  }

  // Sort by similarity score (highest first)
  return duplicateGroups.sort((a, b) => b.similarityScore - a.similarityScore);
}
