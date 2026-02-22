from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        print("Navigating to Play page...")
        page.goto("http://localhost:5173/play")

        print("Waiting for scene text OR error banner...")
        try:
            # Wait for either scene text or error banner
            page.wait_for_selector(".scene-text, .error-banner", timeout=10000)
        except Exception as e:
            print(f"Timeout waiting for selector: {e}")

        print("Taking screenshot...")
        page.screenshot(path="verification/play_page_fixed.png")

        browser.close()

if __name__ == "__main__":
    run()
