import { App } from "./app/App";
import "./styles/main.css";

function bootstrap(): void {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error('Application root element "#app" was not found.');

  const app = new App(root);
  app.initialize();

  // Keep a reference for development tooling and future lifecycle integration.
  window.addEventListener("pagehide", () => app.destroy(), { once: true });
}

bootstrap();
