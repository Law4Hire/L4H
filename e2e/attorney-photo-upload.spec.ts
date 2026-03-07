import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5174'
const DENISE_EMAIL = 'dcann@cannlaw.com'
const DENISE_PASSWORD = 'SecureTest123!'
const TIFF_FILE = 'C:/Users/The_R/Downloads/Willow.jfif'

const EXPECTED_EXTENSIONS = ['.jpg', '.jpeg', '.jfif', '.png', '.gif', '.tiff', '.tif', '.heic', '.webp']

async function loginAsDenise(page: any) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.locator('#email').fill(DENISE_EMAIL)
  await page.locator('#password').fill(DENISE_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

test.describe('Attorney photo upload', () => {

  test('edit form file input accepts all required image types including tiff', async ({ page }) => {
    await loginAsDenise(page)
    await page.goto(`${BASE_URL}/admin/attorneys`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /edit/i }).first().click()
    await page.waitForTimeout(800)

    // Input is hidden by design — query by attached state, not visible
    const fileInput = page.locator('form input[type="file"]').first()
    await expect(fileInput).toHaveCount(1, { timeout: 5000 })

    const accept = await fileInput.getAttribute('accept')
    console.log('Form input accept:', accept)
    for (const ext of EXPECTED_EXTENSIONS) {
      expect(accept, `Form input must accept ${ext}`).toContain(ext)
    }
  })

  test('photo manager modal file input accepts all required image types including tiff', async ({ page }) => {
    await loginAsDenise(page)
    await page.goto(`${BASE_URL}/admin/attorneys`)
    await page.waitForLoadState('networkidle')

    // Hover to reveal the camera overlay on the first attorney card
    const photoWrapper = page.locator('[class*="group/photo"]').first()
    await photoWrapper.hover()
    await page.waitForTimeout(300)
    await photoWrapper.locator('button').first().click()
    await page.waitForTimeout(800)

    const fileInput = page.locator('#photo-upload')
    await expect(fileInput).toHaveCount(1, { timeout: 5000 })

    const accept = await fileInput.getAttribute('accept')
    console.log('Modal input accept:', accept)
    for (const ext of EXPECTED_EXTENSIONS) {
      expect(accept, `Modal input must accept ${ext}`).toContain(ext)
    }
  })

  test('can upload Willow.tiff via edit form (200 response)', async ({ page }) => {
    await loginAsDenise(page)
    await page.goto(`${BASE_URL}/admin/attorneys`)
    await page.waitForLoadState('networkidle')

    await page.getByRole('button', { name: /edit/i }).first().click()
    await page.waitForTimeout(500)

    const uploadDone = page.waitForResponse(
      (r: any) => /\/photo$/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 20000 }
    )

    await page.locator('form input[type="file"]').first().setInputFiles(TIFF_FILE)

    const resp = await uploadDone
    const status = resp.status()
    const body = await resp.text().catch(() => '')
    console.log(`Edit-form upload → HTTP ${status}: ${body}`)

    expect(status, 'TIFF upload via edit form should return 200').toBe(200)
  })

  test('can upload Willow.tiff via photo manager modal (200 response)', async ({ page }) => {
    await loginAsDenise(page)
    await page.goto(`${BASE_URL}/admin/attorneys`)
    await page.waitForLoadState('networkidle')

    const photoWrapper = page.locator('[class*="group/photo"]').first()
    await photoWrapper.hover()
    await page.waitForTimeout(300)
    await photoWrapper.locator('button').first().click()
    await page.waitForTimeout(800)

    const uploadDone = page.waitForResponse(
      (r: any) => /\/photo$/.test(r.url()) && r.request().method() === 'POST',
      { timeout: 20000 }
    )

    await page.locator('#photo-upload').setInputFiles(TIFF_FILE)

    const resp = await uploadDone
    const status = resp.status()
    const body = await resp.text().catch(() => '')
    console.log(`Modal upload → HTTP ${status}: ${body}`)

    expect(status, 'TIFF upload via photo manager should return 200').toBe(200)
  })
})
