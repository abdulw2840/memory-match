import { App } from "./app/App";
import "./styles/main.css";

function bootstrap(): void {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) throw new Error('Application root element "#app" was not found.');

  const app = new App(root);
  app.initialize();

  if (import.meta.hot) {
    import.meta.hot.dispose(() => app.destroy());
  }
}

bootstrap();
