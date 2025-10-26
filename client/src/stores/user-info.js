import { defineStore } from "pinia";
import { ref } from "vue";
export const useUser = defineStore("userInfo", () => {
  const info = ref({
    name: "",
    id: null,
  });

  const setUserInfo = (name, id) => {
    info.value.name = name;
    info.value.id = id;
  };

  return { info, setUserInfo };
})
