import { Contact } from '@/lib/models';

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
  const fullName1 = `${contact1.first_name} ${contact1.last_name}`.trim();
  const fullName2 = `${contact2.first_name} ${contact2.last_name}`.trim();
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
export function findDuplicates(contacts: Contact[], threshold = 70): DuplicateGroup[] {
  const duplicateGroups: DuplicateGroup[] = [];
  const processedContacts = new Set<string>();

  for (let i = 0; i < contacts.length; i++) {
    if (processedContacts.has(contacts[i].id)) continue;

    const currentContact = contacts[i];
    const similarContacts: Contact[] = [currentContact];
    let maxSimilarity = 0;
    let matchTypes = new Set<string>();

    for (let j = i + 1; j < contacts.length; j++) {
      if (processedContacts.has(contacts[j].id)) continue;

      const similarity = calculateContactSimilarity(currentContact, contacts[j]);
      
      if (similarity.similarityScore >= threshold) {
        similarContacts.push(contacts[j]);
        maxSimilarity = Math.max(maxSimilarity, similarity.similarityScore);
        
        // Determine match type
        if (similarity.matchReasons.some(reason => reason.includes('email'))) {
          matchTypes.add('email');
        }
        if (similarity.matchReasons.some(reason => reason.includes('phone'))) {
          matchTypes.add('phone');
        }
        if (similarity.matchReasons.some(reason => reason.includes('name'))) {
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
