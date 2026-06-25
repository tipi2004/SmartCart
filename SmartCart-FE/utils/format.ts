export const formatCurrency = (value?: number | string | null) => {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(Number.isFinite(amount) ? amount : 0);
};

export const unwrapError = (error: unknown) => {
  if (error && typeof error === "object" && "message" in error) {
    return String(error.message);
  }

  return "Có lỗi xảy ra, vui lòng thử lại.";
};
