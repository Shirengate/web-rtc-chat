import { reactive } from "vue";

export const useUser = () => {
  const info = reactive({
    name: "",
    id: null,
  });

  const setUserInfo = (name, id) => {
    info.name = name;
    info.id = id;
  };

  return { info, setUserInfo };
};
