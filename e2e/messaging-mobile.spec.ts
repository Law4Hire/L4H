import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5174'
const DENISE_EMAIL = 'dcann@cannlaw.com'
const DENISE_PASSWORD = 'SecureTest123!'

async function loginAsDenise(page: any) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  
  // Wait for the login form to be ready
  await page.waitForSelector('#email')
  await page.locator('#email').fill(DENISE_EMAIL)
  await page.locator('#password').fill(DENISE_PASSWORD)
  await page.locator('button[type="submit"]').click()
  
  // Wait for the dashboard to load
  await page.waitForURL('**/dashboard**', { timeout: 30000 })
}

test.describe('Messaging Mobile First / Master-Detail UI', () => {

  test('Desktop View: Sidebar and Chat are both visible', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 })
    
    await loginAsDenise(page)
    await page.goto(`${BASE_URL}/messages`)
    
    // Ensure we are on the messages page
    await expect(page).toHaveURL(/.*messages/)
    await page.waitForSelector('[data-testid="messages-container"]')

    // On desktop, both should be visible
    await expect(page.getByTestId('thread-sidebar')).toBeVisible()
    
    // If no thread is selected, the "Select a thread" prompt should be visible
    if (await page.getByTestId('chat-header-name').count() === 0) {
      await expect(page.getByText('Select a thread to start messaging')).toBeVisible()
    } else {
      await expect(page.getByTestId('chat-area')).toBeVisible()
    }
  })

  test('Mobile View: Master-Detail transitions correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    await loginAsDenise(page)
    await page.goto(`${BASE_URL}/messages`)
    
    await page.waitForSelector('[data-testid="messages-container"]')

    // 1. Initial State: Thread list is visible, chat is NOT
    await expect(page.getByTestId('thread-sidebar')).toBeVisible()
    await expect(page.getByTestId('chat-area')).not.toBeVisible()
    
    // 2. Select a thread: Chat becomes visible, Sidebar is hidden
    const threadItem = page.locator('[data-testid^="thread-item-"]').first()
    
    if (await threadItem.count() > 0) {
      await threadItem.click()

      // Sidebar should now be hidden on mobile
      await expect(page.getByTestId('thread-sidebar')).not.toBeVisible()
      // Chat area should now be visible
      await expect(page.getByTestId('chat-area')).toBeVisible()
      
      // Back button should be visible
      const backButton = page.getByTestId('back-to-threads')
      await expect(backButton).toBeVisible()

      // 3. Back button: Sidebar becomes visible again, Chat is hidden
      await backButton.click()
      await expect(page.getByTestId('thread-sidebar')).toBeVisible()
      await expect(page.getByTestId('chat-area')).not.toBeVisible()
    } else {
      // If no threads, check for the "No messages yet" state
      await expect(page.getByTestId('no-threads-message')).toBeVisible()
    }
  })

  test('Resize behavior: Visibility classes update correctly', async ({ page }) => {
    await loginAsDenise(page)
    await page.goto(`${BASE_URL}/messages`)
    await page.waitForSelector('[data-testid="messages-container"]')

    // Start on Desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    
    const threadItem = page.locator('[data-testid^="thread-item-"]').first()
    if (await threadItem.count() > 0) {
        await threadItem.click()
        
        // Both visible on desktop
        await expect(page.getByTestId('thread-sidebar')).toBeVisible()
        await expect(page.getByTestId('chat-area')).toBeVisible()

        // Resize to mobile
        await page.setViewportSize({ width: 375, height: 667 })
        
        // Sidebar hidden, Chat visible on mobile when thread is selected
        await expect(page.getByTestId('thread-sidebar')).not.toBeVisible()
        await expect(page.getByTestId('chat-area')).toBeVisible()

        // Resize back to desktop
        await page.setViewportSize({ width: 1280, height: 720 })
        
        // Both visible again
        await expect(page.getByTestId('thread-sidebar')).toBeVisible()
        await expect(page.getByTestId('chat-area')).toBeVisible()
    }
  })
})
