import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:5174'
const DENISE_EMAIL = 'dcann@cannlaw.com'
const DENISE_PASSWORD = 'SecureTest123!'

const EXPECTED_EXTENSIONS = ['.jpg', '.jpeg', '.jfif', '.png', '.gif', '.tiff', '.tif', '.heic', '.webp']

// Minimal valid file bytes for each format — server validates by extension only,
// so a small but structurally-plausible buffer is sufficient.
// Using inline buffers keeps the suite self-contained and CI-portable.
const FIXTURES = {
  // JFIF: SOI (FF D8) + APP0 marker (FF E0) — smallest recognisable JPEG header
  jfif: {
    name: 'test.jfif',
    mimeType: 'image/jpeg',
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10,
      0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00,
      0x00, 0x01, 0x00, 0x01, 0x00, 0x00]),
  },
  // TIFF: little-endian magic (49 49 2A 00) + offset-to-IFD (08 00 00 00)
  tiff: {
    name: 'test.tiff',
    mimeType: 'image/tiff',
    buffer: Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00]),
  },
}

async function loginAsDenise(page: any) {
  await page.goto(`${BASE_URL}/login`)
  await page.waitForLoadState('networkidle')
  await page.locator('#email').fill(DENISE_EMAIL)
  await page.locator('#password').fill(DENISE_PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL('**/dashboard**', { timeout: 15000 })
}

async function openEditForm(page: any) {
  await page.goto(`${BASE_URL}/admin/attorneys`)
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /edit/i }).first().click()
  await page.waitForTimeout(800)
}

async function openPhotoManagerModal(page: any) {
  await page.goto(`${BASE_URL}/admin/attorneys`)
  await page.waitForLoadState('networkidle')
  const photoWrapper = page.locator('[class*="group/photo"]').first()
  await photoWrapper.hover()
  await page.waitForTimeout(300)
  await photoWrapper.locator('button').first().click()
  await page.waitForTimeout(800)
}

async function capturePhotoUploadResponse(page: any) {
  return page.waitForResponse(
    (r: any) => /\/photo$/.test(r.url()) && r.request().method() === 'POST',
    { timeout: 20000 }
  )
}

test.describe('Attorney photo upload', () => {

  test.describe('file input accept attributes', () => {
    test('edit form accepts all required image types', async ({ page }) => {
      await loginAsDenise(page)
      await openEditForm(page)

      // Input is hidden by design — query by attached state, not visible
      const fileInput = page.locator('form input[type="file"]').first()
      await expect(fileInput).toHaveCount(1, { timeout: 5000 })

      const accept = await fileInput.getAttribute('accept')
      for (const ext of EXPECTED_EXTENSIONS) {
        expect(accept, `Edit form must accept ${ext}`).toContain(ext)
      }
    })

    test('photo manager modal accepts all required image types', async ({ page }) => {
      await loginAsDenise(page)
      await openPhotoManagerModal(page)

      const fileInput = page.locator('#photo-upload')
      await expect(fileInput).toHaveCount(1, { timeout: 5000 })

      const accept = await fileInput.getAttribute('accept')
      for (const ext of EXPECTED_EXTENSIONS) {
        expect(accept, `Photo manager modal must accept ${ext}`).toContain(ext)
      }
    })
  })

  test.describe('upload via edit form (200 response)', () => {
    test('accepts .jfif upload', async ({ page }) => {
      await loginAsDenise(page)
      await openEditForm(page)

      const uploadDone = capturePhotoUploadResponse(page)
      await page.locator('form input[type="file"]').first().setInputFiles(FIXTURES.jfif)

      const resp = await uploadDone
      const status = resp.status()
      const body = await resp.text().catch(() => '')
      console.log(`Edit-form .jfif → HTTP ${status}: ${body}`)
      expect(status, '.jfif upload via edit form should return 200').toBe(200)
    })

    test('accepts .tiff upload', async ({ page }) => {
      await loginAsDenise(page)
      await openEditForm(page)

      const uploadDone = capturePhotoUploadResponse(page)
      await page.locator('form input[type="file"]').first().setInputFiles(FIXTURES.tiff)

      const resp = await uploadDone
      const status = resp.status()
      const body = await resp.text().catch(() => '')
      console.log(`Edit-form .tiff → HTTP ${status}: ${body}`)
      expect(status, '.tiff upload via edit form should return 200').toBe(200)
    })
  })

  test.describe('upload via photo manager modal (200 response)', () => {
    test('accepts .jfif upload', async ({ page }) => {
      await loginAsDenise(page)
      await openPhotoManagerModal(page)

      const uploadDone = capturePhotoUploadResponse(page)
      await page.locator('#photo-upload').setInputFiles(FIXTURES.jfif)

      const resp = await uploadDone
      const status = resp.status()
      const body = await resp.text().catch(() => '')
      console.log(`Modal .jfif → HTTP ${status}: ${body}`)
      expect(status, '.jfif upload via photo manager should return 200').toBe(200)
    })

    test('accepts .tiff upload', async ({ page }) => {
      await loginAsDenise(page)
      await openPhotoManagerModal(page)

      const uploadDone = capturePhotoUploadResponse(page)
      await page.locator('#photo-upload').setInputFiles(FIXTURES.tiff)

      const resp = await uploadDone
      const status = resp.status()
      const body = await resp.text().catch(() => '')
      console.log(`Modal .tiff → HTTP ${status}: ${body}`)
      expect(status, '.tiff upload via photo manager should return 200').toBe(200)
    })
  })
})
