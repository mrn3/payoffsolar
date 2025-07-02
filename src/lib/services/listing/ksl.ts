// KSL Classifieds integration service
import { BasePlatformService, ListingData, ListingResult, PlatformCredentials } from './base';
import puppeteer, { Browser, Page } from 'puppeteer';
import path from 'path';
import fs from 'fs';

interface KslCredentials extends PlatformCredentials {
  username: string;
  password: string;
  apiKey?: string;
}

interface KslListingData {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  location: {
    city: string;
    state: string;
    zipCode: string;
  };
  images: string[];
  contactInfo: {
    preferredContact: string;
    showPhoneNumber: boolean;
  };
}

export class KslService extends BasePlatformService {
  private kslCredentials: KslCredentials;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private debug: boolean = false;

  constructor(platform: any, credentials?: KslCredentials) {
    super(platform, credentials);
    this.kslCredentials = credentials as KslCredentials;
    // Enable debug mode for troubleshooting KSL issues
    this.debug = true;
  }

  protected hasRequiredCredentials(): boolean {
    return !!(
      this.kslCredentials?.username &&
      this.kslCredentials?.password
    );
  }

  // Enable debug mode for troubleshooting
  public enableDebug(): void {
    this.debug = true;
  }

  private async debugLog(message: string): Promise<void> {
    if (this.debug) {
      console.log(`[KSL Debug] ${message}`);
    }
  }

  private async takeScreenshot(filename: string): Promise<void> {
    if (this.debug && this.page) {
      try {
        const tempDir = path.join(process.cwd(), 'temp');
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        const screenshotPath = path.join(tempDir, `ksl_debug_${filename}_${Date.now()}.png`);
        await this.page.screenshot({ path: screenshotPath, fullPage: true });
        console.log(`[KSL Debug] Screenshot saved: ${screenshotPath}`);
      } catch (error) {
        console.error('[KSL Debug] Failed to take screenshot:', error);
      }
    }
  }

  async authenticate(): Promise<boolean> {
    if (!this.validateCredentials()) {
      return false;
    }

    try {
      // Initialize browser if not already done
      if (!this.browser) {
        this.browser = await puppeteer.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        });
      }

      if (!this.page) {
        this.page = await this.browser.newPage();
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await this.page.setViewport({ width: 1280, height: 720 });
      }

      await this.debugLog('Navigating to KSL login page...');

      // Navigate directly to the login page
      await this.page.goto('https://myaccount.ksl.com/login', {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      await this.takeScreenshot('login_page_loaded');

      // Handle cookie notice if present
      try {
        await this.debugLog('Checking for cookie notice...');
        const cookieButtons = await this.page.$$('button');
        for (const button of cookieButtons) {
          const text = await this.page.evaluate(el => el.textContent, button);
          if (text && text.includes('Accept and Continue')) {
            await this.debugLog('Found and clicking cookie accept button...');
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.takeScreenshot('cookie_accepted');
            break;
          }
        }
      } catch (error) {
        await this.debugLog('No cookie notice found or error handling it');
      }

      // Wait for the login form to be visible
      await this.page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 10000 });

      await this.debugLog('Filling in credentials...');

      // Clear any existing values and fill in credentials
      const emailSelector = 'input[type="email"], input[name="email"]';
      const passwordSelector = 'input[type="password"], input[name="password"]';

      await this.debugLog(`Filling email: ${this.kslCredentials.username}`);

      // Clear and fill email field with multiple strategies
      await this.page.click(emailSelector);
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Delete');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Use the most reliable method: focus and type
      await this.page.focus(emailSelector);
      await new Promise(resolve => setTimeout(resolve, 200));

      // Clear the field completely
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Backspace');
      await new Promise(resolve => setTimeout(resolve, 200));

      // Type email in chunks to avoid @ symbol issues
      const emailParts = this.kslCredentials.username.split('@');
      if (emailParts.length === 2) {
        await this.debugLog(`Typing email in parts: "${emailParts[0]}" + "@" + "${emailParts[1]}"`);

        // Type the part before @
        await this.page.keyboard.type(emailParts[0], { delay: 50 });
        await new Promise(resolve => setTimeout(resolve, 100));

        // Type @ symbol
        await this.page.keyboard.type('@', { delay: 50 });
        await new Promise(resolve => setTimeout(resolve, 100));

        // Type the part after @
        await this.page.keyboard.type(emailParts[1], { delay: 50 });
        await new Promise(resolve => setTimeout(resolve, 200));
      } else {
        await this.debugLog('Typing email character by character');
        // Fallback: type character by character
        for (const char of this.kslCredentials.username) {
          await this.page.keyboard.type(char, { delay: 50 });
        }
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Trigger events to ensure the form recognizes the input
      await this.page.evaluate((selector) => {
        const element = document.querySelector(selector);
        if (element) {
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
          element.dispatchEvent(new Event('blur', { bubbles: true }));
        }
      }, emailSelector);

      await this.debugLog(`Filling password...`);

      // Clear and fill password field
      await this.page.click(passwordSelector);
      await this.page.keyboard.down('Control');
      await this.page.keyboard.press('KeyA');
      await this.page.keyboard.up('Control');
      await this.page.keyboard.press('Delete');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Type password character by character
      for (const char of this.kslCredentials.password) {
        await this.page.keyboard.type(char);
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      // Verify the fields were filled correctly
      const emailValue = await this.page.$eval(emailSelector, el => el.value);
      const passwordValue = await this.page.$eval(passwordSelector, el => el.value);

      await this.debugLog(`Email field value: "${emailValue}"`);
      await this.debugLog(`Password field length: ${passwordValue.length}`);

      if (emailValue !== this.kslCredentials.username) {
        await this.debugLog(`WARNING: Email mismatch! Expected: "${this.kslCredentials.username}", Got: "${emailValue}"`);
      }

      await this.takeScreenshot('credentials_filled');
      await this.debugLog('Submitting login form...');

      // Check for any additional form elements that might be required
      const allInputs = await this.page.$$('input');
      for (const input of allInputs) {
        const type = await this.page.evaluate(el => el.type, input);
        const name = await this.page.evaluate(el => el.name, input);
        const required = await this.page.evaluate(el => el.required, input);
        await this.debugLog(`Found input: type=${type}, name=${name}, required=${required}`);
      }

      // Find and click the login button
      const loginButton = await this.page.$('button[type="submit"], input[type="submit"], .login-button, .btn-login');
      if (loginButton) {
        const buttonText = await this.page.evaluate(el => el.textContent || el.value, loginButton);
        await this.debugLog(`Clicking login button: ${buttonText}`);
        await loginButton.click();
      } else {
        await this.debugLog('No login button found, pressing Enter on password field');
        // Try pressing Enter on the password field
        await this.page.keyboard.press('Enter');
      }

      // Wait for navigation or error message
      try {
        await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });
      } catch (navError) {
        await this.debugLog('Navigation timeout, checking current state...');
      }

      await this.takeScreenshot('after_login_attempt');

      // Check for login success indicators
      const currentUrl = this.page.url();
      await this.debugLog(`Current URL after login attempt: ${currentUrl}`);

      // Wait a bit more for any redirects
      await new Promise(resolve => setTimeout(resolve, 2000));
      const finalUrl = this.page.url();
      await this.debugLog(`Final URL after wait: ${finalUrl}`);

      // Check for error messages first
      const errorSelectors = [
        '.error-message',
        '.alert-danger',
        '.login-error',
        '[data-testid="error"]',
        '.field-validation-error',
        '.validation-summary-errors'
      ];

      for (const selector of errorSelectors) {
        const errorElement = await this.page.$(selector);
        if (errorElement) {
          const errorText = await this.page.evaluate(el => el.textContent, errorElement);
          await this.debugLog(`Login error detected: ${errorText}`);
          await this.takeScreenshot('login_error');
          return false;
        }
      }

      // Check if we're still on the login page (indicates failure)
      if (finalUrl.includes('login') || finalUrl.includes('signin')) {
        await this.debugLog('Still on login page - authentication failed');

        // Check for any visible error text on the page
        const pageText = await this.page.evaluate(() => document.body.innerText);
        if (pageText.toLowerCase().includes('invalid') ||
            pageText.toLowerCase().includes('incorrect') ||
            pageText.toLowerCase().includes('error')) {
          await this.debugLog('Found error text on page');
        }

        await this.takeScreenshot('login_failed_still_on_login_page');
        return false;
      }

      // Check for various success indicators
      const successIndicators = [
        '.user-menu',
        '.account-menu',
        '.logout',
        '[data-testid="user-menu"]',
        '.user-profile',
        'a[href*="logout"]',
        'a[href*="account"]'
      ];

      let isLoggedIn = false;
      for (const selector of successIndicators) {
        const element = await this.page.$(selector);
        if (element) {
          await this.debugLog(`Found success indicator: ${selector}`);
          isLoggedIn = true;
          break;
        }
      }

      // Also check URL patterns for success
      if (!isLoggedIn) {
        isLoggedIn = (finalUrl.includes('myaccount.ksl.com') ||
                     finalUrl.includes('account') ||
                     finalUrl.includes('dashboard')) &&
                   !finalUrl.includes('login') &&
                   !finalUrl.includes('error');

        if (isLoggedIn) {
          await this.debugLog('Success detected by URL pattern');
        }
      }

      await this.debugLog(`Login success: ${isLoggedIn}`);
      if (isLoggedIn) {
        await this.takeScreenshot('login_success');
      }
      return isLoggedIn;

    } catch (error) {
      console.error('KSL authentication failed:', error);
      await this.cleanup();
      return false;
    }
  }

  async createListing(data: ListingData): Promise<ListingResult> {
    if (!this.validateCredentials()) {
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      // Authenticate first
      const authenticated = await this.authenticate();
      if (!authenticated) {
        return { success: false, error: 'Authentication failed' };
      }

      if (!this.page) {
        return { success: false, error: 'Browser page not initialized' };
      }

      // Prepare listing data
      const listingData: KslListingData = {
        title: data.title,
        description: data.description,
        price: data.price,
        category: this.mapKslCategory(data.category),
        condition: 'new',
        location: {
          city: data.location?.city || 'Salt Lake City',
          state: data.location?.state || 'UT',
          zipCode: data.location?.zipCode || '84101'
        },
        images: data.images.slice(0, 8), // KSL typically allows up to 8 images
        contactInfo: {
          preferredContact: 'text',
          showPhoneNumber: true
        }
      };

      // Navigate to create listing page
      await this.debugLog('Navigating to KSL sell page...');
      await this.page.goto('https://classifieds.ksl.com/sell', { waitUntil: 'networkidle2' });
      await this.takeScreenshot('sell_page_loaded');

      // Debug: Check what elements are actually on the page
      await this.debugLog('Checking page content for category selectors...');
      const pageContent = await this.page.evaluate(() => {
        const selectors = [
          '.category-selector',
          '[class*="category"]',
          '[class*="Category"]',
          'select',
          'button',
          'input',
          '[data-category]',
          '.dropdown',
          '.select'
        ];

        const results = {};
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          results[selector] = elements.length;
          if (elements.length > 0) {
            results[`${selector}_examples`] = Array.from(elements).slice(0, 5).map(el => ({
              tagName: el.tagName,
              className: el.className,
              id: el.id,
              textContent: el.textContent?.substring(0, 100),
              attributes: Array.from(el.attributes).reduce((acc, attr) => {
                acc[attr.name] = attr.value;
                return acc;
              }, {})
            }));
          }
        });

        // Also check for any form elements that might be category-related
        const forms = document.querySelectorAll('form');
        results['forms'] = forms.length;
        if (forms.length > 0) {
          results['form_examples'] = Array.from(forms).slice(0, 2).map(form => ({
            action: form.action,
            method: form.method,
            inputs: Array.from(form.querySelectorAll('input, select, textarea')).slice(0, 10).map(input => ({
              type: input.type,
              name: input.name,
              id: input.id,
              placeholder: input.placeholder
            }))
          }));
        }

        return results;
      });

      await this.debugLog(`Page elements found: ${JSON.stringify(pageContent, null, 2)}`);

      // Wait for and click the category selection
      await this.debugLog('Waiting for category selector...');
      try {
        await this.page.waitForSelector('.category-selector', { timeout: 10000 });
        await this.debugLog('Category selector found!');
      } catch (error) {
        await this.debugLog('Category selector not found, trying alternative selectors...');
        await this.takeScreenshot('category_selector_not_found');

        // Try alternative selectors
        const alternativeSelectors = [
          'select[name*="category"]',
          '[data-testid*="category"]',
          '.category-dropdown',
          '.category-select',
          'select.form-control',
          'select',
          '[class*="category"]'
        ];

        let foundSelector = null;
        for (const selector of alternativeSelectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 2000 });
            foundSelector = selector;
            await this.debugLog(`Found alternative selector: ${selector}`);
            break;
          } catch (e) {
            // Continue to next selector
          }
        }

        if (!foundSelector) {
          throw new Error('No category selector found on page');
        }
      }

      // Select appropriate category
      await this.debugLog(`Attempting to select category: ${listingData.category}`);
      try {
        await this.selectCategory(listingData.category);
        await this.debugLog('Category selection completed');
      } catch (error) {
        await this.debugLog(`Category selection failed: ${error.message}`);
        // Continue anyway - some listings might not require category selection
      }

      // Fill in the listing form
      await this.fillListingForm(listingData);

      // Upload images if any
      if (listingData.images.length > 0) {
        await this.uploadImages(listingData.images);
      }

      // Submit the listing
      const listingUrl = await this.submitListing();

      if (listingUrl) {
        // Extract listing ID from URL
        const listingIdMatch = listingUrl.match(/listing\/(\d+)/);
        const listingId = listingIdMatch ? listingIdMatch[1] : `ksl_${Date.now()}`;

        return {
          success: true,
          listingId,
          listingUrl,
          warnings: ['KSL listing created via automation - manual verification recommended']
        };
      } else {
        return {
          success: false,
          error: 'Failed to create listing - no URL returned'
        };
      }
    } catch (error) {
      console.error('KSL listing creation failed:', error);
      await this.cleanup();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async updateListing(listingId: string, data: Partial<ListingData>): Promise<ListingResult> {
    if (!this.validateCredentials()) {
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      // Authenticate first
      const authenticated = await this.authenticate();
      if (!authenticated) {
        return { success: false, error: 'Authentication failed' };
      }

      if (!this.page) {
        return { success: false, error: 'Browser page not initialized' };
      }

      // Navigate to edit listing page
      await this.page.goto(`https://classifieds.ksl.com/edit/${listingId}`, { waitUntil: 'networkidle2' });

      // Check if edit page loaded successfully
      const editFormExists = await this.page.$('form.edit-listing') !== null;
      if (!editFormExists) {
        return {
          success: false,
          error: 'Could not access edit page for listing'
        };
      }

      // Update the listing fields that were provided
      if (data.title) {
        await this.page.evaluate(() => {
          const titleInput = document.querySelector('input[name="title"]') as HTMLInputElement;
          if (titleInput) titleInput.value = '';
        });
        await this.page.type('input[name="title"]', data.title);
      }

      if (data.description) {
        await this.page.evaluate(() => {
          const descInput = document.querySelector('textarea[name="description"]') as HTMLTextAreaElement;
          if (descInput) descInput.value = '';
        });
        await this.page.type('textarea[name="description"]', data.description);
      }

      if (data.price) {
        await this.page.evaluate(() => {
          const priceInput = document.querySelector('input[name="price"]') as HTMLInputElement;
          if (priceInput) priceInput.value = '';
        });
        await this.page.type('input[name="price"]', data.price.toString());
      }

      // Submit the update
      await this.page.click('button[type="submit"]');
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 });

      return {
        success: true,
        listingId,
        listingUrl: `https://classifieds.ksl.com/listing/${listingId}`,
        warnings: ['KSL listing updated via automation']
      };
    } catch (error) {
      console.error('KSL listing update failed:', error);
      await this.cleanup();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async deleteListing(listingId: string): Promise<ListingResult> {
    if (!this.validateCredentials()) {
      return { success: false, error: 'Invalid credentials' };
    }

    try {
      // Authenticate first
      const authenticated = await this.authenticate();
      if (!authenticated) {
        return { success: false, error: 'Authentication failed' };
      }

      if (!this.page) {
        return { success: false, error: 'Browser page not initialized' };
      }

      // Navigate to my listings page
      await this.page.goto('https://myaccount.ksl.com/listings?vertical=Classifieds', { waitUntil: 'networkidle2' });

      // Find and delete the specific listing
      const deleteButton = await this.page.$(`[data-listing-id="${listingId}"] .delete-button`);
      if (deleteButton) {
        await deleteButton.click();

        // Confirm deletion if prompted
        const confirmButton = await this.page.$('.confirm-delete');
        if (confirmButton) {
          await confirmButton.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        return {
          success: true,
          warnings: ['KSL listing deleted via automation']
        };
      } else {
        // If listing is not found, treat as successful deletion since the goal is achieved
        return {
          success: true,
          warnings: ['Listing not found or already deleted - treating as successful deletion']
        };
      }
    } catch (error) {
      console.error('KSL listing deletion failed:', error);
      await this.cleanup();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getListingStatus(listingId: string): Promise<{ status: string; url?: string }> {
    if (!this.validateCredentials()) {
      return { status: 'error' };
    }

    try {
      if (!this.page) {
        // Initialize browser for status check
        await this.authenticate();
      }

      if (!this.page) {
        return { status: 'error' };
      }

      // Navigate to the listing page
      const listingUrl = `https://classifieds.ksl.com/listing/${listingId}`;
      await this.page.goto(listingUrl, { waitUntil: 'networkidle2' });

      // Check if listing exists and is active
      const listingExists = await this.page.$('.listing-details') !== null;
      const isExpired = await this.page.$('.listing-expired') !== null;
      const isDeleted = await this.page.$('.listing-not-found') !== null;

      let status = 'error';
      if (isDeleted) {
        status = 'ended';
      } else if (isExpired) {
        status = 'ended';
      } else if (listingExists) {
        status = 'active';
      }

      return {
        status,
        url: listingUrl
      };
    } catch (error) {
      console.error('KSL status check failed:', error);
      return { status: 'error' };
    }
  }

  private async cleanup(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
        this.page = null;
      }
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }

  private async selectCategory(category: string): Promise<void> {
    if (!this.page) return;

    await this.debugLog(`Looking for category selection elements for: ${category}`);

    // Map our internal categories to KSL category and subcategory structure
    const categoryMapping: Record<string, { category: string; subcategory: string }> = {
      'electronics': { category: 'Home and Garden', subcategory: 'Electrical' },
      'home_garden': { category: 'Home and Garden', subcategory: 'Electrical' },
      'automotive': { category: 'Automotive', subcategory: 'Cars' },
      'sporting_goods': { category: 'Sporting Goods', subcategory: 'Exercise' }
    };

    const mapping = categoryMapping[category] || { category: 'Home and Garden', subcategory: 'Electrical' };
    await this.debugLog(`Using KSL category: "${mapping.category}" and subcategory: "${mapping.subcategory}"`);

    try {
      // Step 1: Fill the category text input
      await this.debugLog('Step 1: Looking for category text input...');

      // Look for the category input field
      const categorySelectors = [
        'input[name="category"]',
        'input[aria-label="Category"]',
        'input[aria-label*="Category"]'
      ];

      let categoryInput = null;
      for (const selector of categorySelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          categoryInput = await this.page.$(selector);
          if (categoryInput) {
            await this.debugLog(`Found category input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (!categoryInput) {
        throw new Error('Could not find category input field');
      }

      // Clear and type the category
      await this.debugLog(`Step 2: Typing "${mapping.category}" into category field...`);
      await categoryInput.click();
      await categoryInput.evaluate(el => el.value = ''); // Clear the field
      await categoryInput.type(mapping.category, { delay: 100 });
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.debugLog('Category typed successfully');

      // Step 3: Fill the subcategory text input
      await this.debugLog('Step 3: Looking for subcategory text input...');

      // Look for subcategory input field
      const subcategorySelectors = [
        'input[name="subCategory"]',
        'input[name="subcategory"]',
        'input[aria-label="Subcategory"]',
        'input[aria-label*="Subcategory"]'
      ];

      let subcategoryInput = null;
      for (const selector of subcategorySelectors) {
        try {
          await this.page.waitForSelector(selector, { timeout: 3000 });
          subcategoryInput = await this.page.$(selector);
          if (subcategoryInput) {
            await this.debugLog(`Found subcategory input with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      if (subcategoryInput) {
        // Clear and type the subcategory
        await this.debugLog(`Step 4: Typing "${mapping.subcategory}" into subcategory field...`);
        await subcategoryInput.click();
        await subcategoryInput.evaluate(el => el.value = ''); // Clear the field
        await subcategoryInput.type(mapping.subcategory, { delay: 100 });
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.debugLog('Subcategory typed successfully');
      } else {
        await this.debugLog('No subcategory input found - may not be required');
      }

      await this.debugLog('Category selection process completed successfully');

    } catch (error) {
      await this.debugLog(`Category selection failed: ${error.message}`);
      await this.takeScreenshot('category_selection_failed');
      throw error;
    }
  }

  private async fillListingForm(listingData: KslListingData): Promise<void> {
    if (!this.page) return;

    // Wait for form to be ready
    await this.page.waitForSelector('input[name="title"]', { timeout: 10000 });

    // Fill title
    await this.page.type('input[name="title"]', listingData.title);

    // Fill description
    await this.page.waitForSelector('textarea[name="description"]');
    await this.page.type('textarea[name="description"]', listingData.description);

    // Fill price
    await this.page.waitForSelector('input[name="price"]');
    await this.page.type('input[name="price"]', listingData.price.toString());

    // Select condition
    const conditionSelector = `select[name="condition"] option[value="${listingData.condition}"]`;
    const conditionExists = await this.page.$(conditionSelector) !== null;
    if (conditionExists) {
      await this.page.select('select[name="condition"]', listingData.condition);
    }

    // Fill location if fields exist
    const cityInput = await this.page.$('input[name="city"]');
    if (cityInput) {
      await this.page.type('input[name="city"]', listingData.location.city);
    }

    const stateSelect = await this.page.$('select[name="state"]');
    if (stateSelect) {
      await this.page.select('select[name="state"]', listingData.location.state);
    }

    const zipInput = await this.page.$('input[name="zipCode"]');
    if (zipInput) {
      await this.page.type('input[name="zipCode"]', listingData.location.zipCode);
    }

    // Set contact preferences
    const contactMethodSelect = await this.page.$('select[name="contactMethod"]');
    if (contactMethodSelect) {
      await this.page.select('select[name="contactMethod"]', listingData.contactInfo.preferredContact);
    }

    const showPhoneCheckbox = await this.page.$('input[name="showPhone"]');
    if (showPhoneCheckbox && listingData.contactInfo.showPhoneNumber) {
      await this.page.click('input[name="showPhone"]');
    }
  }

  private async uploadImages(imagePaths: string[]): Promise<void> {
    if (!this.page || imagePaths.length === 0) return;

    try {
      // Wait for file upload input
      await this.page.waitForSelector('input[type="file"]', { timeout: 5000 });

      // Convert image URLs to local file paths if needed
      const localImagePaths: string[] = [];

      for (const imagePath of imagePaths) {
        if (imagePath.startsWith('http')) {
          // Download image to temp location
          const tempPath = await this.downloadImage(imagePath);
          if (tempPath) {
            localImagePaths.push(tempPath);
          }
        } else {
          // Assume it's already a local path
          localImagePaths.push(imagePath);
        }
      }

      if (localImagePaths.length > 0) {
        // Upload files
        const fileInput = await this.page.$('input[type="file"]');
        if (fileInput) {
          await fileInput.uploadFile(...localImagePaths);

          // Wait for upload to complete
          await this.page.waitForTimeout(3000);
        }
      }
    } catch (error) {
      console.warn('Image upload failed:', error);
      // Continue without images rather than failing the entire listing
    }
  }

  private async downloadImage(imageUrl: string): Promise<string | null> {
    try {
      if (!this.page) return null;

      const response = await this.page.goto(imageUrl);
      if (!response || !response.ok()) return null;

      const buffer = await response.buffer();
      const tempDir = path.join(process.cwd(), 'temp');

      // Ensure temp directory exists
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const fileName = `ksl_image_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const filePath = path.join(tempDir, fileName);

      fs.writeFileSync(filePath, buffer);
      return filePath;
    } catch (error) {
      console.error('Error downloading image:', error);
      return null;
    }
  }

  private async submitListing(): Promise<string | null> {
    if (!this.page) return null;

    try {
      // Submit the form
      await this.page.click('button[type="submit"]');

      // Wait for navigation to listing page
      await this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });

      // Get the current URL which should be the listing page
      const currentUrl = this.page.url();

      // Verify it's a valid listing URL
      if (currentUrl.includes('classifieds.ksl.com/listing/')) {
        return currentUrl;
      }

      return null;
    } catch (error) {
      console.error('Error submitting listing:', error);
      return null;
    }
  }

  private mapKslCategory(category?: string): string {
    const categoryMap: Record<string, string> = {
      'solar-panels': 'electronics',
      'inverters': 'electronics',
      'batteries': 'electronics',
      'mounting-systems': 'home_garden',
      'accessories': 'electronics'
    };

    return categoryMap[category || ''] || 'electronics';
  }
}
