import { ref } from "vue";

const toast = ref({
  show: false,
  message: "",
  color: "success",
  timeout: 3000,
});

export function showToast(message, color = "success", timeout = 3000) {
  toast.value.show = false;
  setTimeout(() => {
    toast.value = {
      show: true,
      message,
      color,
      timeout,
    };
  }, 50);
}

export function useToast() {
  return toast;
}
