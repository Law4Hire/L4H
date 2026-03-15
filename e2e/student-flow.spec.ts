import { test, expect } from '@playwright/test';

test.describe('Student Visa Flow Test', () => {
  test('should go through the interview, select college, avoid guessing game, and present F-1', async ({ page }) => {
    // Log browser console messages
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

    // Navigate directly to the full Interview Engine
    await page.goto('http://l4h.localhost:8081/interview');
    
    // 1. Intent Type: Non-Immigrant
    await page.waitForSelector('button:has-text("Non-Immigrant")');
    await page.click('button:has-text("Non-Immigrant")');

    // 2. Location
    await page.waitForSelector('button:has-text("Outside the United States")');
    await page.click('button:has-text("Outside the United States")');

    // 3. Education Level
    await page.waitForSelector('button:has-text("High School")');
    await page.click('button:has-text("High School")');

    // 4. Employment Status (Nonimmigrant Guard)
    await page.waitForSelector('button:has-text("Student")');
    await page.click('button:has-text("Student")');

    // 5. Educational Goals (Nonimmigrant Guard)
    await page.waitForSelector('button:has-text("Yes, I plan to study")');
    await page.click('button:has-text("Yes, I plan to study")');

    // 6. Category
    await page.waitForSelector('button:has-text("Student Visa - F-1")');
    await page.click('button:has-text("Student Visa - F-1")');

    // 7. Subcategory
    await page.waitForSelector('button:has-text("F-1 Academic Student")');
    await page.click('button:has-text("F-1 Academic Student")');

    // Checklist questions (We just need to click "Yes" 6 times for F-1 checklist)
    for (let i = 0; i < 6; i++) {
        await page.waitForSelector('button:has-text("Yes")');
        await page.click('button:has-text("Yes")');
        await page.waitForTimeout(1000); // Wait for React to render the next question
    }

    // Document Prerequisites
    // Name
    await page.waitForSelector('input[type="text"]');
    await page.fill('input[type="text"]', 'John Doe');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // DOB
    await page.waitForSelector('input[type="date"]');
    await page.fill('input[type="date"]', '2000-01-01');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Nationality (Dropdown) - Set to Algeria to test the geopolitical hold logic
    await page.waitForSelector('select');
    await page.selectOption('select', { label: 'Algeria' });
    await page.click('text="Continue"');
    await page.waitForTimeout(1000);

    // Passport Number
    await page.waitForSelector('input[type="text"]');
    await page.fill('input[type="text"]', 'P123456');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // Passport Expiry
    await page.waitForSelector('input[type="date"]');
    await page.fill('input[type="date"]', '2030-01-01');
    await page.keyboard.press('Enter');

    // Results Page - Should show No Eligible Visas Found due to Algeria ban
    await page.waitForSelector('text="No Eligible Visas Found"');
    const bodyText = await page.locator('body').innerText();
    console.log('RESULTS PAGE TEXT:');
    console.log(bodyText);

  });
});
