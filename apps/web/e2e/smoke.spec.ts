import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

/**
 * Smoke test.
 *
 * Proves the primary surfaces stay distinct and covers one small local-first edit path.
 */

test("landing page presents the product and links into the app", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Reactively", level: 1 })).toBeVisible();
  // Exact match: the footer repeats the tagline as part of a longer sentence.
  await expect(page.getByText("React Native, visually.", { exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Open Reactively" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("creates a local project, opens it, and restores it after refresh", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page.getByRole("heading", { name: "Reactively Projects" })).toBeVisible();

  await page.getByRole("button", { name: "New Project" }).click();
  await expect(page).toHaveURL(/\/editor\/project_[a-z0-9]+$/);

  await expect(page.getByText("Untitled Project")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Pages" })).toBeVisible();
  await expect(page.getByText("Home", { exact: true })).toBeVisible();
  await expect(page.getByText("No component selected")).toBeVisible();

  await page.getByRole("button", { name: "Add Button" }).click();
  const renderedButton = page.getByRole("button", { name: "Select Button" });
  await expect(renderedButton).toBeVisible();

  await renderedButton.click();
  await page.getByRole("textbox", { name: "Title" }).fill("Get Started");
  await expect(renderedButton).toContainText("Get Started");

  const projectId = page.url().split("/").at(-1);
  expect(projectId).toBeTruthy();
  await expect
    .poll(() => readPersistedButtonLabel(page, projectId ?? ""))
    .toBe("Get Started");

  await page.reload();

  await expect(page.getByText("Untitled Project")).toBeVisible();
  await expect(page.getByText("Home", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Select Button" })).toContainText("Get Started");

  // The editor must not inherit marketing chrome.
  await expect(page.getByRole("contentinfo")).toHaveCount(0);
});

test("persists inspector layout values after refresh", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "New Project" }).click();
  await expect(page).toHaveURL(/\/editor\/project_[a-z0-9]+$/);

  await page.getByRole("button", { name: "Add Button" }).click();
  await page.getByRole("button", { name: "Select Button" }).click();

  await chooseInspectorOption(page, "Position", "Absolute");
  await page.getByRole("textbox", { name: "X", exact: true }).fill("20");
  await page.getByRole("textbox", { name: "Y", exact: true }).fill("30");
  await chooseInspectorOption(page, "Width", "Fixed");
  await page.getByRole("textbox", { name: "Width value" }).fill("200");
  await page.getByRole("textbox", { name: "Height" }).fill("56");
  await page.getByRole("textbox", { name: "Margin top" }).fill("16");
  await page.getByRole("textbox", { name: "Padding left" }).fill("24");
  await page.getByRole("textbox", { name: "Padding right" }).fill("24");

  const projectId = page.url().split("/").at(-1);
  expect(projectId).toBeTruthy();
  await expect
    .poll(() => readPersistedButtonLayout(page, projectId ?? ""))
    .toEqual({
      position: "absolute",
      left: { type: "points", value: 20 },
      top: { type: "points", value: 30 },
      width: { type: "points", value: 200 },
      height: { type: "points", value: 56 },
      margin: { top: 16 },
      padding: { horizontal: 20, vertical: 12, left: 24, right: 24 },
    });

  await page.reload();
  await page.getByRole("button", { name: "Select Button" }).click();

  await expect(page.getByRole("combobox", { name: "Position" })).toHaveAttribute(
    "data-value",
    "absolute",
  );
  await expect(page.getByRole("textbox", { name: "X", exact: true })).toHaveValue("20");
  await expect(page.getByRole("textbox", { name: "Y", exact: true })).toHaveValue("30");
  await expect(page.getByRole("combobox", { name: "Width" })).toHaveAttribute("data-value", "fixed");
  await expect(page.getByRole("textbox", { name: "Width value" })).toHaveValue("200");
  await expect(page.getByRole("textbox", { name: "Height" })).toHaveValue("56");
  await expect(page.getByRole("textbox", { name: "Margin top" })).toHaveValue("16");
  await expect(page.getByRole("textbox", { name: "Padding left" })).toHaveValue("24");
  await expect(page.getByRole("textbox", { name: "Padding right" })).toHaveValue("24");
});

test("persists inspector Flexbox values after refresh", async ({ page }) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "New Project" }).click();
  await expect(page).toHaveURL(/\/editor\/project_[a-z0-9]+$/);

  await page.getByRole("button", { name: "Add Button" }).click();
  await page.getByRole("button", { name: "Select Button" }).click();

  await page.getByRole("textbox", { name: "Flex Grow" }).fill("1");
  await chooseInspectorOption(page, "Align Self", "Center");

  const projectId = page.url().split("/").at(-1);
  expect(projectId).toBeTruthy();
  await expect
    .poll(() => readPersistedButtonFlexbox(page, projectId ?? ""))
    .toEqual({
      flexGrow: 1,
      flexShrink: undefined,
      alignSelf: "center",
    });

  await page.reload();
  await page.getByRole("button", { name: "Select Button" }).click();

  await expect(page.getByRole("textbox", { name: "Flex Grow" })).toHaveValue("1");
  await expect(page.getByRole("textbox", { name: "Flex Shrink" })).toHaveValue("0");
  await expect(page.getByRole("combobox", { name: "Align Self" })).toHaveAttribute(
    "data-value",
    "center",
  );
});

test("preview route renders in isolation from the editor", async ({ page }) => {
  await page.goto("/preview/demo");

  await expect(page.getByRole("heading", { name: "Reactively Preview" })).toBeVisible();
  await expect(page.getByText("React Native Web preview will render here.")).toBeVisible();

  // No editor chrome: the preview is embeddable in an iframe.
  await expect(page.getByRole("heading", { name: "Properties" })).toHaveCount(0);
});

async function chooseInspectorOption(page: Page, name: string, option: string) {
  await page.getByRole("combobox", { name }).click();
  await page.getByRole("option", { name: option }).click();
}

async function readPersistedButtonLabel(
  page: Page,
  projectId: string,
): Promise<unknown> {
  return page.evaluate(
    ({ databaseName, id }) =>
      new Promise((resolve, reject) => {
        const openRequest = indexedDB.open(databaseName);

        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const transaction = database.transaction("projects", "readonly");
          const getRequest = transaction.objectStore("projects").get(id);

          getRequest.onerror = () => reject(getRequest.error);
          getRequest.onsuccess = () => {
            const row = getRequest.result as
              | {
                  document?: {
                    nodes?: Record<
                      string,
                      { type?: string; props?: { label?: unknown } }
                    >;
                  };
                }
              | undefined;
            const nodes = row?.document?.nodes;
            const button = nodes
              ? Object.values(nodes).find((node) => node.type === "Button")
              : undefined;

            resolve(button?.props?.label);
            database.close();
          };
        };
      }),
    { databaseName: "reactively", id: projectId },
  );
}

async function readPersistedButtonLayout(
  page: Page,
  projectId: string,
): Promise<unknown> {
  return page.evaluate(
    ({ databaseName, id }) =>
      new Promise((resolve, reject) => {
        const openRequest = indexedDB.open(databaseName);

        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const transaction = database.transaction("projects", "readonly");
          const getRequest = transaction.objectStore("projects").get(id);

          getRequest.onerror = () => reject(getRequest.error);
          getRequest.onsuccess = () => {
            const row = getRequest.result as
              | {
                  document?: {
                    nodes?: Record<
                      string,
                      {
                        type?: string;
                        style?: {
                          position?: unknown;
                          left?: unknown;
                          top?: unknown;
                          width?: unknown;
                          height?: unknown;
                          margin?: unknown;
                          padding?: unknown;
                        };
                      }
                    >;
                  };
                }
              | undefined;
            const nodes = row?.document?.nodes;
            const button = nodes
              ? Object.values(nodes).find((node) => node.type === "Button")
              : undefined;
            const style = button?.style;

            resolve({
              position: style?.position,
              left: style?.left,
              top: style?.top,
              width: style?.width,
              height: style?.height,
              margin: style?.margin,
              padding: style?.padding,
            });
            database.close();
          };
        };
      }),
    { databaseName: "reactively", id: projectId },
  );
}

async function readPersistedButtonFlexbox(
  page: Page,
  projectId: string,
): Promise<unknown> {
  return page.evaluate(
    ({ databaseName, id }) =>
      new Promise((resolve, reject) => {
        const openRequest = indexedDB.open(databaseName);

        openRequest.onerror = () => reject(openRequest.error);
        openRequest.onsuccess = () => {
          const database = openRequest.result;
          const transaction = database.transaction("projects", "readonly");
          const getRequest = transaction.objectStore("projects").get(id);

          getRequest.onerror = () => reject(getRequest.error);
          getRequest.onsuccess = () => {
            const row = getRequest.result as
              | {
                  document?: {
                    nodes?: Record<
                      string,
                      {
                        type?: string;
                        style?: {
                          flexGrow?: unknown;
                          flexShrink?: unknown;
                          alignSelf?: unknown;
                        };
                      }
                    >;
                  };
                }
              | undefined;
            const nodes = row?.document?.nodes;
            const button = nodes
              ? Object.values(nodes).find((node) => node.type === "Button")
              : undefined;
            const style = button?.style;

            resolve({
              flexGrow: style?.flexGrow,
              flexShrink: style?.flexShrink,
              alignSelf: style?.alignSelf,
            });
            database.close();
          };
        };
      }),
    { databaseName: "reactively", id: projectId },
  );
}
