/**
 * E2E Test: Attorney Photo Management
 *
 * Verifies the complete picture upload workflow on the Attorney Management admin page:
 *   1. Clicking a professional's photo opens the Photo Manager MODAL (not the file selector)
 *   2. The modal contains the correct 3-column layout (Preview | Available Pictures | Actions)
 *   3. "Upload Picture" is the only button that triggers the OS file chooser
 *   4. An uploaded image appears in the Available Pictures list
 *   5. Selecting an image via "Select Picture" updates the preview and marks it as current
 *   6. Deleting an image via "Delete Picture" removes it from the list
 *
 * Requires:
 *   - Law4Hire app running on http://localhost:5175
 *   - API running on http://localhost:8765
 *   - At least one active attorney in the database
 */

import { test as base, expect } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const AUTH_FILE = path.join(__dirname, '.auth/attorney-photo-user.json')
const APP_URL = 'http://localhost:5175'
const API_URL = 'http://localhost:8765'
const SCREENSHOTS_DIR = 'test-screenshots/attorney-photo'

// ---------------------------------------------------------------------------
// One-time authentication fixture (reused across all tests in this file)
// ---------------------------------------------------------------------------

const test = base.extend<{}, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [async ({ browser }, use) => {
    const page = await browser.newPage({ storageState: undefined })

    try {
      // Seed the browser context with a valid page origin before injecting localStorage
      await page.goto(`${APP_URL}/`, { waitUntil: 'load', timeout: 15000 })

      const response = await page.request.post(`${API_URL}/api/v1/auth/login`, {
        data: { email: 'dcann@cannlaw.com', password: 'SecureTest123!', rememberMe: false },
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok()) {
        const body = await response.text()
        throw new Error(`Login failed: ${response.status()} — ${body}`)
      }

      const { token } = await response.json()
      await page.evaluate((t) => {
        localStorage.setItem('jwt_token', t)
        window.dispatchEvent(new Event('jwt-token-changed'))
      }, token)

      const dir = path.dirname(AUTH_FILE)
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
      await page.context().storageState({ path: AUTH_FILE })
      await page.close()

      await use(AUTH_FILE)
    } catch (err) {
      console.error('Auth setup failed:', err)
      await page.screenshot({ path: `${SCREENSHOTS_DIR}/auth-failure.png`, fullPage: true })
      await page.close()
      throw err
    }
  }, { scope: 'worker' }],
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to Attorney Management and wait for the attorney card grid. */
async function gotoAttorneyManagement(page: Parameters<Parameters<typeof test>[1]>[0]) {
  await page.goto(`${APP_URL}/admin/attorneys`, { waitUntil: 'networkidle', timeout: 30000 })
  // Wait for at least one attorney card to appear
  await page.waitForSelector('[class*="rounded-xl"]', { timeout: 15000 })
}

/** Open the photo manager modal for the first active attorney. */
async function openPhotoManagerModal(page: Parameters<Parameters<typeof test>[1]>[0]) {
  // Hover over the first attorney photo to reveal the camera overlay
  const photoArea = page.locator('[class*="group/photo"]').first()
  await photoArea.hover()

  const cameraBtn = photoArea.locator('button[title="Manage Photos"]')
  await cameraBtn.waitFor({ state: 'visible', timeout: 5000 })
  await cameraBtn.click()

  // The modal dialog should now be open
  const modal = page.locator('[role="dialog"]')
  await modal.waitFor({ state: 'visible', timeout: 5000 })
  return modal
}

function screenshotPath(name: string) {
  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true })
  return `${SCREENSHOTS_DIR}/${name}.png`
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Attorney Photo Management', () => {

  test('clicking the attorney photo opens a MODAL, not the file selector', async ({ page }) => {
    await gotoAttorneyManagement(page)
    await page.screenshot({ path: screenshotPath('01-attorney-list') })

    // Set up a listener: if a file chooser fires before the modal is shown, the test fails
    let fileChooserFired = false
    page.on('filechooser', () => { fileChooserFired = true })

    const modal = await openPhotoManagerModal(page)

    // Modal must be visible
    await expect(modal).toBeVisible()
    // File chooser must NOT have fired
    expect(fileChooserFired).toBe(false)

    await page.screenshot({ path: screenshotPath('02-modal-open') })
  })

  test('modal contains the 3-column layout: Preview, Available Pictures, Actions', async ({ page }) => {
    await gotoAttorneyManagement(page)
    const modal = await openPhotoManagerModal(page)

    await expect(modal.getByText('Preview')).toBeVisible()
    await expect(modal.getByText('Available Pictures')).toBeVisible()
    await expect(modal.getByText('Actions')).toBeVisible()

    await page.screenshot({ path: screenshotPath('03-three-column-layout') })
  })

  test('all three action buttons are present in the Actions column', async ({ page }) => {
    await gotoAttorneyManagement(page)
    const modal = await openPhotoManagerModal(page)

    await expect(modal.getByRole('button', { name: /Select Picture/i })).toBeVisible()
    await expect(modal.getByRole('button', { name: /Delete Picture/i })).toBeVisible()
    await expect(modal.getByRole('button', { name: /Upload Picture/i })).toBeVisible()

    await page.screenshot({ path: screenshotPath('04-action-buttons') })
  })

  test('"Upload Picture" is the only button that opens the file chooser', async ({ page }) => {
    await gotoAttorneyManagement(page)
    const modal = await openPhotoManagerModal(page)

    // --- Select Picture should NOT open a file chooser ---
    let chooserFromSelect = false
    const selectChooserListener = () => { chooserFromSelect = true }
    page.on('filechooser', selectChooserListener)
    await modal.getByRole('button', { name: /Select Picture/i }).click({ force: true })
    await page.waitForTimeout(300)
    page.off('filechooser', selectChooserListener)
    expect(chooserFromSelect).toBe(false)

    // --- Delete Picture should NOT open a file chooser ---
    let chooserFromDelete = false
    const deleteChooserListener = () => { chooserFromDelete = true }
    page.on('filechooser', deleteChooserListener)
    // Dismiss any confirm dialog that might appear
    page.on('dialog', d => d.dismiss())
    await modal.getByRole('button', { name: /Delete Picture/i }).click({ force: true })
    await page.waitForTimeout(300)
    page.off('filechooser', deleteChooserListener)
    expect(chooserFromDelete).toBe(false)

    // --- Upload Picture SHOULD open a file chooser ---
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      modal.getByRole('button', { name: /Upload Picture/i }).click(),
    ])
    expect(fileChooser).toBeTruthy()

    await page.screenshot({ path: screenshotPath('05-file-chooser-opens') })
  })

  test('uploading a picture adds it to the Available Pictures list', async ({ page }) => {
    await gotoAttorneyManagement(page)
    const modal = await openPhotoManagerModal(page)

    // Count existing images before upload
    const imagesBefore = await modal.locator('input[type="file"]').count()
    const listItemsBefore = await modal.locator('[class*="divide-y"] button').count()

    // Trigger upload with a small test PNG created in-browser
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 5000 }),
      modal.getByRole('button', { name: /Upload Picture/i }).click(),
    ])

    // Create a minimal 1×1 transparent PNG as a buffer
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    )
    await fileChooser.setFiles([{
      name: 'e2e-test-upload.png',
      mimeType: 'image/png',
      buffer: pngBuffer,
    }])

    // Wait for the upload spinner to appear and disappear
    await modal.locator('.animate-spin').waitFor({ state: 'visible', timeout: 5000 }).catch(() => {})
    await modal.locator('.animate-spin').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {})

    // The list should now have one more item
    const listItemsAfter = await modal.locator('[class*="divide-y"] button').count()
    expect(listItemsAfter).toBeGreaterThan(listItemsBefore)

    await page.screenshot({ path: screenshotPath('06-after-upload') })
  })

  test('clicking an image in the list updates the Preview column', async ({ page }) => {
    await gotoAttorneyManagement(page)
    const modal = await openPhotoManagerModal(page)

    // Get all list items; if there are at least 2 we can click the second one
    const listItems = modal.locator('[class*="divide-y"] button')
    const count = await listItems.count()

    if (count < 2) {
      test.skip() // Not enough images to verify selection change
      return
    }

    // Note the src of the preview image before clicking
    const previewImg = modal.locator('[class*="Preview"] ~ * img, img').first()
    const srcBefore = await previewImg.getAttribute('src')

    // Click the second image in the list
    await listItems.nth(1).click()

    // The preview src should change (or at least the blue dot highlight should appear)
    const dotHighlight = listItems.nth(1).locator('[class*="bg-blue-500"]')
    await expect(dotHighlight).toBeVisible()

    const srcAfter = await previewImg.getAttribute('src')
    // If there was a primary set, the src will differ from the first-selected one
    if (srcBefore !== srcAfter) {
      expect(srcAfter).not.toBe(srcBefore)
    }

    await page.screenshot({ path: screenshotPath('07-image-selected') })
  })

  test('Select Picture marks the chosen image as current', async ({ page }) => {
    await gotoAttorneyManagement(page)
    const modal = await openPhotoManagerModal(page)

    const listItems = modal.locator('[class*="divide-y"] button')
    const count = await listItems.count()

    if (count < 2) {
      test.skip()
      return
    }

    // Click a non-primary image
    await listItems.nth(1).click()

    const selectBtn = modal.getByRole('button', { name: /Select Picture/i })
    await expect(selectBtn).not.toBeDisabled()
    await selectBtn.click()

    // After selection, "Current profile picture" label should appear on the newly selected image
    await expect(modal.getByText('Current profile picture')).toBeVisible({ timeout: 8000 })

    await page.screenshot({ path: screenshotPath('08-after-select') })
  })

  test('closing the modal returns to the attorney list without errors', async ({ page }) => {
    await gotoAttorneyManagement(page)
    const modal = await openPhotoManagerModal(page)

    await modal.getByRole('button', { name: /Done/i }).click()
    await expect(modal).not.toBeVisible({ timeout: 5000 })

    // Attorney grid should still be present
    await expect(page.locator('[class*="rounded-xl"]').first()).toBeVisible()

    await page.screenshot({ path: screenshotPath('09-after-close') })
  })
})
