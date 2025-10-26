import "@fontsource/montserrat/300.css";
import "@fontsource/montserrat/400.css";
import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "primeicons/primeicons.css";
import "./style.css";
import { createApp } from "vue";
import App from "./App.vue";
import PrimeVue from "primevue/config";

import Aura from "@primeuix/themes/aura";
import { definePreset } from "@primeuix/themes";
import { createPinia } from "pinia";
import MainPage from "./pages/MainPage.vue";
import Room from "@pages/Room/index.vue";

import { createRouter, createWebHistory } from "vue-router";
const pinia = createPinia();
const routes = [
  {
    path: "/",
    component: MainPage,
  },
  {
    path: "/room/:id",
    component: Room,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Черно-белая тема
const BlackWhitePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: "{zinc.50}",
      100: "{zinc.100}",
      200: "{zinc.200}",
      300: "{zinc.300}",
      400: "{zinc.400}",
      500: "{zinc.500}",
      600: "{zinc.600}",
      700: "{zinc.700}",
      800: "{zinc.800}",
      900: "{zinc.900}",
      950: "{zinc.950}",
    },
    colorScheme: {
      light: {
        primary: {
          color: "{zinc.950}",
          inverseColor: "#ffffff",
          hoverColor: "{zinc.900}",
          activeColor: "{zinc.800}",
        },
        highlight: {
          background: "{zinc.950}",
          focusBackground: "{zinc.700}",
          color: "#ffffff",
          focusColor: "#ffffff",
        },
      },
      dark: {
        primary: {
          color: "{zinc.50}",
          inverseColor: "{zinc.950}",
          hoverColor: "{zinc.100}",
          activeColor: "{zinc.200}",
        },
        highlight: {
          background: "rgba(250, 250, 250, .16)",
          focusBackground: "rgba(250, 250, 250, .24)",
          color: "rgba(255,255,255,.87)",
          focusColor: "rgba(255,255,255,.87)",
        },
      },
    },
  },
});

const app = createApp(App);

app
  .use(router)
  .use(PrimeVue, {
    theme: {
      preset: BlackWhitePreset,
      options: {
        darkModeSelector: true, // Для переключения темной темы
        cssLayer: false,
      },
    },
  })
  .use(pinia)
  .mount("#app");
