import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import MainPage from "./components/MainPage.vue";
import Room from "./components/Room.vue";
import { createRouter, createWebHistory } from "vue-router";
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
const app = createApp(App);

app.use(router).mount("#app");
