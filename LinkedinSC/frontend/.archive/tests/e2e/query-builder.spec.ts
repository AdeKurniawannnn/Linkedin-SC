import { test, expect } from '@playwright/test'

test.describe('Query Builder Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/query-builder')
  })

  test.describe('Page Load', () => {
    test('displays page title and instructions', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /LinkedIn Query Builder/i })).toBeVisible()
      await expect(page.getByText(/Cara Pakai/i)).toBeVisible()
    })

    test('displays site filter with all options', async ({ page }) => {
      await expect(page.getByRole('button', { name: /All/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Profile/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Posts/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Jobs/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /Company/i })).toBeVisible()
    })

    test('displays instructions card with usage steps', async ({ page }) => {
      await expect(page.getByText(/Pilih tipe konten LinkedIn/i)).toBeVisible()
      await expect(page.getByText(/Search LinkedIn/i)).toBeVisible()
    })
  })

  test.describe('Filter Switching', () => {
    test('switches to profile search form', async ({ page }) => {
      await page.getByRole('button', { name: /Profile/i }).click()
      await expect(page.getByLabel(/Role/i)).toBeVisible()
    })

    test('switches to posts search form', async ({ page }) => {
      await page.getByRole('button', { name: /Posts/i }).click()
      await expect(page.getByLabel(/Keywords/i)).toBeVisible()
      await expect(page.getByText(/Author Type/i)).toBeVisible()
    })

    test('switches to jobs search form', async ({ page }) => {
      await page.getByRole('button', { name: /Jobs/i }).click()
      await expect(page.getByLabel(/Job Title/i)).toBeVisible()
      await expect(page.getByText(/Experience Level/i)).toBeVisible()
    })

    test('switches to company search form', async ({ page }) => {
      await page.getByRole('button', { name: /Company/i }).click()
      await expect(page.getByLabel(/Industry/i)).toBeVisible()
    })

    test('switches to all search form', async ({ page }) => {
      await page.getByRole('button', { name: /All/i }).click()
      await expect(page.getByLabel(/Keywords/i)).toBeVisible()
    })
  })

  test.describe('Profile Search Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /Profile/i }).click()
    })

    test('completes profile search form with all fields', async ({ page }) => {
      await page.getByLabel(/Role/i).fill('Software Engineer')
      await page.getByLabel(/Location/i).fill('Jakarta')

      // Check form is filled
      await expect(page.getByLabel(/Role/i)).toHaveValue('Software Engineer')
      await expect(page.getByLabel(/Location/i)).toHaveValue('Jakarta')
    })

    test('search button is present and clickable', async ({ page }) => {
      const searchButton = page.getByRole('button', { name: /Search/i })
      await expect(searchButton).toBeVisible()
      await expect(searchButton).toBeEnabled()
    })
  })

  test.describe('Posts Search Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /Posts/i }).click()
    })

    test('fills posts search form with keywords', async ({ page }) => {
      await page.getByLabel(/Keywords/i).fill('AI machine learning')
      await expect(page.getByLabel(/Keywords/i)).toHaveValue('AI machine learning')
    })

    test('displays author type selector', async ({ page }) => {
      await expect(page.getByText(/Author Type/i)).toBeVisible()
    })
  })

  test.describe('Jobs Search Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /Jobs/i }).click()
    })

    test('fills job title field', async ({ page }) => {
      await page.getByLabel(/Job Title/i).fill('Frontend Developer')
      await expect(page.getByLabel(/Job Title/i)).toHaveValue('Frontend Developer')
    })

    test('displays experience level options', async ({ page }) => {
      await expect(page.getByText(/Experience Level/i)).toBeVisible()
    })
  })

  test.describe('Company Search Flow', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByRole('button', { name: /Company/i }).click()
    })

    test('displays industry field', async ({ page }) => {
      await expect(page.getByLabel(/Industry/i)).toBeVisible()
    })
  })

  test.describe('Loading State', () => {
    test('shows progress bar during search with mocked API', async ({ page }) => {
      await page.getByRole('button', { name: /Profile/i }).click()
      await page.getByLabel(/Role/i).fill('Test Role')

      // Intercept API call to delay response
      await page.route('**/api/search**', async route => {
        await new Promise(resolve => setTimeout(resolve, 1000))
        await route.fulfill({
          status: 200,
          json: { profiles: [], metadata: { query: 'test', total_results: 0 } }
        })
      })

      await page.getByRole('button', { name: /Search/i }).click()

      // Progress bar should appear during loading
      await expect(page.locator('[role="progressbar"]')).toBeVisible()
    })
  })

  test.describe('Page Layout', () => {
    test('displays footer with attribution', async ({ page }) => {
      await expect(page.getByText(/Powered by Bright Data/i)).toBeVisible()
    })

    test('has proper page structure', async ({ page }) => {
      // Header
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()

      // Instructions card
      await expect(page.getByText(/Cara Pakai/i)).toBeVisible()

      // Site filter
      await expect(page.getByRole('button', { name: /Profile/i })).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('all form fields have labels', async ({ page }) => {
      await page.getByRole('button', { name: /Profile/i }).click()

      // Role field should have proper label
      const roleLabel = page.getByLabel(/Role/i)
      await expect(roleLabel).toBeVisible()
    })

    test('buttons are keyboard accessible', async ({ page }) => {
      // Tab to first filter button
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should be able to navigate and activate with keyboard
      const focusedElement = await page.locator(':focus')
      await expect(focusedElement).toBeVisible()
    })
  })
})
