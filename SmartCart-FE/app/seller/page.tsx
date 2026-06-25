"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Edit3,
  ImageIcon,
  Loader2,
  PackagePlus,
  Plus,
  Search,
  ShoppingBag,
  Store,
  Trash2,
  UploadCloud,
  X
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { OrderQrCard } from "@/components/orders/OrderQrCard";
import { Button } from "@/components/ui/Button";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { sellerService, type SellerProductPayload } from "@/services/sellerService";
import { useAuthModalStore } from "@/store/authModalStore";
import { useAuthStore } from "@/store/authStore";
import { useToastStore } from "@/store/toastStore";
import type { Category, Order, Product, Shop } from "@/types";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/format";

type ProductFormState = {
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  imageFile: File | null;
  imagePreview: string;
};

type SellerTab = "products" | "orders";
type OrderFilter = "all" | "payment" | "pending" | "confirmed" | "cancelled";

const emptyProductForm: ProductFormState = {
  name: "",
  description: "",
  price: "",
  stockQuantity: "100",
  categoryId: "",
  imageFile: null,
  imagePreview: ""
};

export default function SellerPage() {
  const { accessToken, hydrate } = useAuthStore();
  const { openLogin } = useAuthModalStore();
  const { showToast } = useToastStore();

  const [shop, setShop] = useState<Shop | null>(null);
  const [shopName, setShopName] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [keyword, setKeyword] = useState("");
  const [activeTab, setActiveTab] = useState<SellerTab>("products");
  const [orderFilter, setOrderFilter] = useState<OrderFilter>("all");
  const [loading, setLoading] = useState(true);
  const [savingShop, setSavingShop] = useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [savingProduct, setSavingProduct] = useState(false);
  const [hidingId, setHidingId] = useState<string | null>(null);
  const [workingOrderId, setWorkingOrderId] = useState<string | null>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const isLoggedIn = Boolean(accessToken || (typeof window !== "undefined" && localStorage.getItem("smartcart_access_token")));

  const loadSellerData = async () => {
    if (!isLoggedIn) {
      setLoading(false);
      openLogin();
      return;
    }

    setLoading(true);
    try {
      const categoryList = await productService.getCategories();
      setCategories(categoryList);

      try {
        const myShop = await sellerService.getMyShop();
        setShop(myShop || null);
        setShopName(myShop?.name || "");
        const [productList, orderList] = await Promise.all([sellerService.getMyProducts(), sellerService.getMyOrders()]);
        setProducts(productList);
        setOrders(orderList);
      } catch {
        setShop(null);
        setShopName("");
        setProducts([]);
        setOrders([]);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không tải được kênh bán hàng.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSellerData();
  }, [isLoggedIn]);

  const shopStatus = normalizeShopStatus(shop?.status);
  const canManageProducts = shopStatus !== "suspended";
  const activeCount = products.filter((product) => product.isActive !== false).length;
  const hiddenCount = products.length - activeCount;
  const pendingCount = products.filter((product) => normalizeApproval(product.approvalStatus) === "pending").length;

  const filteredProducts = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return products.filter((product) => {
      if (!query) return true;
      return (
        product.name.toLowerCase().includes(query) ||
        product.categoryName?.toLowerCase().includes(query) ||
        product.id.toLowerCase().includes(query)
      );
    });
  }, [keyword, products]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderFilter === "all") return true;
      if (orderFilter === "payment") return order.paymentStatus === "processing";
      return order.status === orderFilter;
    });
  }, [orderFilter, orders]);

  const openCreateProduct = () => {
    if (!canManageProducts) {
      showToast("Shop đang bị khóa, bạn không thể đăng sản phẩm mới.", "error");
      return;
    }
    if (categories.length === 0) {
      showToast("Chưa có danh mục sản phẩm để đăng bán.", "error");
      return;
    }
    setEditingProduct(null);
    setProductForm({ ...emptyProductForm, categoryId: categories[0].id });
    setProductModalOpen(true);
  };

  const openEditProduct = (product: Product) => {
    if (!canManageProducts) {
      showToast("Shop đang bị khóa, bạn không thể chỉnh sửa sản phẩm.", "error");
      return;
    }
    const categoryId = categories.find((category) => category.name === product.categoryName)?.id || categories[0]?.id || "";
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: String(product.basePrice || ""),
      stockQuantity: String(product.stockQuantity ?? 100),
      categoryId,
      imageFile: null,
      imagePreview: product.imageUrl || ""
    });
    setProductModalOpen(true);
  };

  const closeProductModal = () => {
    if (savingProduct) return;
    setProductModalOpen(false);
    setEditingProduct(null);
    setProductForm(emptyProductForm);
  };

  const updateShop = async () => {
    if (!shopName.trim()) {
      showToast("Tên shop không được để trống.", "error");
      return;
    }
    setSavingShop(true);
    try {
      const updated = await sellerService.updateMyShop({ name: shopName.trim() });
      if (updated) setShop(updated);
      showToast("Đã cập nhật tên shop.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không cập nhật được tên shop.", "error");
    } finally {
      setSavingShop(false);
    }
  };

  const submitProduct = async (event: FormEvent) => {
    event.preventDefault();
    const price = Number(productForm.price);
    const stockQuantity = Number(productForm.stockQuantity);
    if (!productForm.name.trim() || !productForm.categoryId || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stockQuantity) || stockQuantity < 0) {
      showToast("Vui lòng nhập tên, giá, danh mục và tồn kho hợp lệ.", "error");
      return;
    }

    const payload: SellerProductPayload = {
      name: productForm.name.trim(),
      description: productForm.description.trim(),
      price,
      stockQuantity,
      categoryId: productForm.categoryId,
      imageFile: productForm.imageFile,
      imageUrl: editingProduct && !productForm.imageFile ? editingProduct.imageUrl || "" : ""
    };

    setSavingProduct(true);
    try {
      if (editingProduct) {
        const updated = await sellerService.updateProduct(editingProduct.id, payload);
        if (updated) {
          setProducts((current) => current.map((product) => (product.id === updated.id ? updated : product)));
        }
        showToast("Đã cập nhật sản phẩm. Sản phẩm sẽ chờ admin duyệt lại.");
      } else {
        await sellerService.createProduct(payload);
        showToast("Đã đăng sản phẩm. Sản phẩm sẽ hiển thị sau khi admin duyệt.");
        await loadSellerData();
      }
      closeProductModal();
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không lưu được sản phẩm.", "error");
    } finally {
      setSavingProduct(false);
    }
  };

  const hideProduct = async (product: Product) => {
    if (!window.confirm(`Ẩn sản phẩm "${product.name}"?`)) return;
    setHidingId(product.id);
    try {
      await sellerService.hideProduct(product.id);
      setProducts((current) => current.map((item) => (item.id === product.id ? { ...item, isActive: false } : item)));
      showToast("Đã ẩn sản phẩm.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không ẩn được sản phẩm.", "error");
    } finally {
      setHidingId(null);
    }
  };

  const updateOrder = (updated?: Order) => {
    if (!updated) return;
    setOrders((current) => current.map((order) => (order.id === updated.id ? updated : order)));
  };

  const confirmPayment = async (order: Order) => {
    setWorkingOrderId(order.id);
    try {
      updateOrder(await orderService.confirmPayment(order.id));
      showToast("Đã xác nhận thanh toán.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không xác nhận được thanh toán.", "error");
    } finally {
      setWorkingOrderId(null);
    }
  };

  const confirmOrder = async (order: Order) => {
    setWorkingOrderId(order.id);
    try {
      updateOrder(await orderService.confirmOrder(order.id));
      showToast("Đã xác nhận đơn hàng.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Không xác nhận được đơn hàng.", "error");
    } finally {
      setWorkingOrderId(null);
    }
  };

  return (
    <>
      <Header overlay />
      <main className="min-h-screen bg-[#eef8ff] px-5 pb-24 pt-32 text-[#092768] md:px-8">
        <section className="mx-auto max-w-7xl">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-[1.5rem] border border-white/75 bg-white/72 p-8 shadow-[0_24px_70px_rgba(72,108,176,0.16)] backdrop-blur-xl">
              <p className="inline-flex rounded-full bg-[#dff2ff] px-4 py-2 text-sm font-black text-[#2563eb]">Kênh bán hàng</p>
              <h1 className="mt-5 text-4xl font-black text-[#11285f] md:text-5xl">Shop của tôi</h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-[#607198]">
                Dành cho cửa hàng tiện lợi quanh trường hoặc sinh viên đăng bán, pass lại đồ cho nhau.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <Stat label="Sản phẩm" value={products.length} />
              <Stat label="Đang bán" value={activeCount} />
              <Stat label="Chờ duyệt" value={pendingCount} />
              <Stat label="Đã ẩn" value={hiddenCount} />
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/75 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.15)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="text-sm font-black text-[#0b2463]">Tên shop</label>
                  {shop && <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-black", shopStatusClass(shopStatus))}>{shopStatusLabel(shopStatus)}</span>}
                </div>
                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={shopName}
                    onChange={(event) => setShopName(event.target.value)}
                    placeholder={shop ? "Tên shop của bạn" : "Shop sẽ được tạo sau khi đăng sản phẩm đầu tiên"}
                    className="h-12 flex-1 rounded-2xl border border-[#d8e8ff] bg-white/90 px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55"
                    disabled={!shop}
                  />
                  <Button variant="ghost" onClick={updateShop} disabled={!shop || savingShop}>
                    {savingShop ? <Loader2 className="h-4 w-4 animate-spin" /> : <Store className="h-4 w-4" />}
                    Lưu tên shop
                  </Button>
                </div>
                {!shop && (
                  <p className="mt-2 text-sm font-bold text-[#607198]">
                    Bạn chưa có shop. Hãy đăng sản phẩm đầu tiên, hệ thống sẽ tự tạo shop và gửi sản phẩm tới admin duyệt.
                  </p>
                )}
                {shop && shopStatus !== "active" && (
                  <div className="mt-4 rounded-2xl border border-[#d8e8ff] bg-[#f4f9ff]/90 p-4 text-sm font-bold text-[#607198]">
                    {shopStatus === "pending"
                      ? "Shop của bạn đang chờ admin duyệt. Bạn vẫn có thể chuẩn bị sản phẩm, nhưng sản phẩm chỉ hiển thị công khai sau khi shop được duyệt."
                      : "Shop của bạn đang bị khóa. Sản phẩm sẽ không hiển thị công khai cho tới khi admin mở lại shop."}
                  </div>
                )}
              </div>

              <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" onClick={openCreateProduct} disabled={!canManageProducts}>
                <PackagePlus className="h-4 w-4" />
                Đăng sản phẩm
              </Button>
            </div>
          </div>

          <div className="mt-8 rounded-[1.5rem] border border-white/75 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.15)] backdrop-blur-xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-2 overflow-x-auto">
                <TabButton active={activeTab === "products"} onClick={() => setActiveTab("products")}>
                  Sản phẩm
                </TabButton>
                <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>
                  Đơn hàng ({orders.length})
                </TabButton>
              </div>

              {activeTab === "products" ? (
                <div className="relative flex-1 lg:max-w-xl">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6b7daa]" />
                  <input
                    value={keyword}
                    onChange={(event) => setKeyword(event.target.value)}
                    placeholder="Tìm sản phẩm của shop..."
                    className="h-12 w-full rounded-full border border-[#d8e8ff] bg-white/90 pl-12 pr-5 text-sm font-bold text-[#11285f] outline-none focus:ring-4 focus:ring-[#bcd8ff]/55"
                  />
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto">
                  {orderFilterOptions.map((option) => (
                    <TabButton key={option.value} active={orderFilter === option.value} onClick={() => setOrderFilter(option.value)}>
                      {option.label}
                    </TabButton>
                  ))}
                </div>
              )}
            </div>

            {loading ? (
              <div className="grid min-h-80 place-items-center">
                <Loader2 className="h-9 w-9 animate-spin text-[#3567ff]" />
              </div>
            ) : activeTab === "orders" ? (
              <SellerOrdersPanel
                orders={filteredOrders}
                workingOrderId={workingOrderId}
                onConfirmPayment={confirmPayment}
                onConfirmOrder={confirmOrder}
              />
            ) : filteredProducts.length === 0 ? (
              <EmptySellerState onCreate={openCreateProduct} canCreate={canManageProducts} />
            ) : (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {filteredProducts.map((product) => (
                  <SellerProductCard
                    key={product.id}
                    product={product}
                    hiding={hidingId === product.id}
                    canEdit={canManageProducts}
                    onEdit={openEditProduct}
                    onHide={hideProduct}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      {productModalOpen && (
        <ProductFormModal
          form={productForm}
          categories={categories}
          editingProduct={editingProduct}
          saving={savingProduct}
          onClose={closeProductModal}
          onSubmit={submitProduct}
          onChange={setProductForm}
        />
      )}
    </>
  );
}

const orderFilterOptions: Array<{ value: OrderFilter; label: string }> = [
  { value: "all", label: "Tất cả" },
  { value: "payment", label: "Chờ thanh toán" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "cancelled", label: "Đã hủy" }
];

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("min-w-max rounded-full px-5 py-3 text-sm font-black transition", active ? "bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white" : "bg-white text-[#0b2463]")}
    >
      {children}
    </button>
  );
}

function EmptySellerState({ onCreate, canCreate }: { onCreate: () => void; canCreate: boolean }) {
  return (
    <div className="grid min-h-80 place-items-center text-center">
      <div>
        <ShoppingBag className="mx-auto h-12 w-12 text-[#3567ff]" />
        <p className="mt-4 text-xl font-black text-[#11285f]">Chưa có sản phẩm phù hợp.</p>
        <p className="mt-2 text-sm font-bold text-[#607198]">Đăng sản phẩm đầu tiên để tạo shop và gửi admin duyệt.</p>
        <Button className="mt-5 bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" onClick={onCreate} disabled={!canCreate}>
          <Plus className="h-4 w-4" />
          Đăng sản phẩm đầu tiên
        </Button>
      </div>
    </div>
  );
}

function SellerProductCard({
  product,
  hiding,
  canEdit,
  onEdit,
  onHide
}: {
  product: Product;
  hiding: boolean;
  canEdit: boolean;
  onEdit: (product: Product) => void;
  onHide: (product: Product) => void;
}) {
  const isActive = product.isActive !== false;
  const approval = normalizeApproval(product.approvalStatus);

  return (
    <article className="grid gap-4 rounded-[1.25rem] border border-[#dbeaff] bg-white/86 p-4 shadow-[0_14px_36px_rgba(76,107,171,0.12)] sm:grid-cols-[132px_1fr]">
      <div className="aspect-square overflow-hidden rounded-[1.1rem] bg-[#f4f9ff]">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-[#607198]">
            <ImageIcon className="h-9 w-9" />
          </div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="line-clamp-2 text-lg font-black text-[#0b2463]">{product.name}</p>
            <p className="mt-1 text-xs font-black uppercase text-[#607198]">{product.categoryName || "Chưa có danh mục"}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <span className={cn("rounded-full px-3 py-1 text-xs font-black", approvalClass(approval))}>{approvalLabel(approval)}</span>
            <span className={cn("rounded-full px-3 py-1 text-xs font-black", isActive ? "bg-mint/70 text-[#17664f]" : "bg-blush/70 text-[#8d2845]")}>
              {isActive ? "Đang bán" : "Đã ẩn"}
            </span>
          </div>
        </div>
        <p className="mt-4 text-2xl font-black text-[#ff3d9a]">{formatCurrency(product.basePrice)}</p>
        <p className="mt-1 text-sm font-black text-[#3567ff]">Tồn kho: {product.stockQuantity ?? 0}</p>
        <p className="mt-2 line-clamp-2 text-sm font-bold text-[#607198]">{product.description || "Sản phẩm chưa có mô tả."}</p>
        {approval === "rejected" && product.rejectionReason && (
          <div className="mt-3 rounded-2xl border border-[#ffd7e8] bg-[#fff0f6] p-3 text-sm font-bold text-[#9b244f]">
            <span className="font-black">Lý do từ chối: </span>
            {product.rejectionReason}
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={() => onEdit(product)} disabled={!canEdit}>
            <Edit3 className="h-4 w-4" />
            Sửa
          </Button>
          {isActive && (
            <Button className="bg-[#ffd7e8] text-[#9b244f] hover:bg-[#ffc8df]" disabled={hiding} onClick={() => onHide(product)}>
              {hiding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Ẩn
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

function SellerOrdersPanel({
  orders,
  workingOrderId,
  onConfirmPayment,
  onConfirmOrder
}: {
  orders: Order[];
  workingOrderId: string | null;
  onConfirmPayment: (order: Order) => void;
  onConfirmOrder: (order: Order) => void;
}) {
  if (orders.length === 0) {
    return (
      <div className="grid min-h-80 place-items-center text-center">
        <div>
          <ShoppingBag className="mx-auto h-12 w-12 text-[#3567ff]" />
          <p className="mt-4 text-xl font-black text-[#11285f]">Chưa có đơn hàng phù hợp.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {orders.map((order) => {
        const canConfirmPayment = order.paymentStatus === "processing" && order.status !== "cancelled";
        const canConfirmOrder = order.status === "pending" && (order.paymentMethod === "cod" || order.paymentStatus === "paid");
        return (
          <article key={order.id} className="grid gap-4 rounded-[1.25rem] border border-[#dbeaff] bg-white/86 p-4 shadow-[0_14px_36px_rgba(76,107,171,0.12)] lg:grid-cols-[180px_1fr_170px_240px] lg:items-center">
            <div>
              <p className="font-black text-[#0b2463]">#{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="mt-1 text-sm font-bold text-[#607198]">{order.createdAt ? new Date(order.createdAt).toLocaleString("vi-VN") : "Đang cập nhật"}</p>
              <span className={cn("mt-3 inline-flex rounded-full px-3 py-1 text-xs font-black", statusClass(order))}>{statusLabel(order)}</span>
            </div>
            <div>
              <p className="line-clamp-2 font-black text-[#0b2463]">{order.items?.map((item) => item.productName).join(", ") || "Đơn hàng SmartCart"}</p>
              <p className="mt-2 text-sm font-bold text-[#607198]">
                {paymentLabel(order.paymentMethod)} - {paymentStatusLabel(order.paymentStatus)}
              </p>
              <p className="mt-1 line-clamp-2 text-xs font-bold text-[#8b9abb]">{order.shippingAddress || "Chưa có địa chỉ"}</p>
            </div>
            <p className="text-lg font-black text-[#ff3d9a] lg:text-right">{formatCurrency(order.totalAmount || 0)}</p>
            <div className="grid gap-2">
              <OrderQrCard orderId={order.id} compact />
              {canConfirmPayment && (
                <Button className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" disabled={workingOrderId === order.id} onClick={() => onConfirmPayment(order)}>
                  {workingOrderId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Xác nhận thanh toán
                </Button>
              )}
              {canConfirmOrder && (
                <Button variant="ghost" disabled={workingOrderId === order.id} onClick={() => onConfirmOrder(order)}>
                  {workingOrderId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Xác nhận đơn
                </Button>
              )}
              {!canConfirmPayment && !canConfirmOrder && <Button variant="ghost">Đã xử lý</Button>}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ProductFormModal({
  form,
  categories,
  editingProduct,
  saving,
  onClose,
  onSubmit,
  onChange
}: {
  form: ProductFormState;
  categories: Category[];
  editingProduct: Product | null;
  saving: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent) => void;
  onChange: (form: ProductFormState) => void;
}) {
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      onChange({ ...form, imageFile: null, imagePreview: editingProduct?.imageUrl || "" });
      return;
    }
    onChange({
      ...form,
      imageFile: file,
      imagePreview: URL.createObjectURL(file)
    });
  };

  return (
    <div className="fixed inset-0 z-[80] grid place-items-center overflow-y-auto px-4 py-8">
      <button type="button" className="absolute inset-0 bg-[#17244f]/50 backdrop-blur-md" onClick={onClose} aria-label="Đóng form sản phẩm" />
      <form onSubmit={onSubmit} className="relative w-full max-w-3xl rounded-[1.75rem] border border-white bg-white/96 p-6 shadow-[0_30px_110px_rgba(20,38,84,0.34)] md:p-8">
        <button type="button" onClick={onClose} className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white text-[#092768] shadow-[0_14px_34px_rgba(59,87,150,0.18)]">
          <X className="h-5 w-5" />
        </button>
        <p className="inline-flex rounded-full bg-[#e9f4ff] px-4 py-2 text-sm font-black text-[#3567ff]">Sản phẩm</p>
        <h2 className="mt-4 text-3xl font-black text-[#092768]">{editingProduct ? "Sửa sản phẩm" : "Đăng sản phẩm"}</h2>

        <div className="mt-7 grid gap-4 md:grid-cols-2">
          <label className="block md:col-span-2">
            <span className="text-sm font-black text-[#0b2463]">Tên sản phẩm</span>
            <input value={form.name} onChange={(event) => onChange({ ...form, name: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55" />
          </label>
          <label className="block">
            <span className="text-sm font-black text-[#0b2463]">Giá bán</span>
            <input type="number" min="1" value={form.price} onChange={(event) => onChange({ ...form, price: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55" />
          </label>
          <label className="block">
            <span className="text-sm font-black text-[#0b2463]">Số lượng tồn kho</span>
            <input type="number" min="0" step="1" value={form.stockQuantity} onChange={(event) => onChange({ ...form, stockQuantity: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55" />
          </label>
          <label className="block">
            <span className="text-sm font-black text-[#0b2463]">Danh mục</span>
            <select value={form.categoryId} onChange={(event) => onChange({ ...form, categoryId: event.target.value })} className="mt-2 h-12 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55">
              <option value="">Chọn danh mục</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <div className="md:col-span-2">
            <span className="text-sm font-black text-[#0b2463]">Ảnh sản phẩm</span>
            <div className="mt-2 grid gap-4 rounded-2xl border border-[#d8e8ff] bg-white p-4 md:grid-cols-[160px_1fr]">
              <div className="aspect-square overflow-hidden rounded-2xl bg-[#f4f9ff]">
                {form.imagePreview ? (
                  <img src={form.imagePreview} alt="Ảnh sản phẩm" className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-[#607198]">
                    <ImageIcon className="h-10 w-10" />
                  </div>
                )}
              </div>
              <div className="flex flex-col justify-center">
                <label className="inline-flex h-12 w-max cursor-pointer items-center gap-2 rounded-2xl bg-gradient-to-r from-[#3567ff] to-[#d83cff] px-5 text-sm font-black text-white shadow-[0_16px_34px_rgba(93,94,255,0.22)]">
                  <UploadCloud className="h-4 w-4" />
                  Chọn ảnh
                  <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
                <p className="mt-3 text-sm font-bold text-[#607198]">
                  {form.imageFile ? form.imageFile.name : "Chọn ảnh từ máy để upload khi lưu sản phẩm."}
                </p>
              </div>
            </div>
          </div>
          <label className="block md:col-span-2">
            <span className="text-sm font-black text-[#0b2463]">Mô tả</span>
            <textarea value={form.description} onChange={(event) => onChange({ ...form, description: event.target.value })} rows={4} className="mt-2 w-full rounded-2xl border border-[#d8e8ff] bg-white px-4 py-3 font-bold outline-none focus:ring-4 focus:ring-[#bcd8ff]/55" />
          </label>
        </div>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-[#3567ff] to-[#d83cff] text-white hover:opacity-90" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <PackagePlus className="h-4 w-4" />}
            {editingProduct ? "Lưu thay đổi" : "Đăng sản phẩm"}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[1.35rem] border border-white/80 bg-white/78 p-5 shadow-[0_24px_70px_rgba(72,108,176,0.12)] backdrop-blur-xl">
      <span className="grid h-12 w-12 place-items-center rounded-[1rem] bg-[#dff2ff] text-[#3567ff]">
        <ShoppingBag className="h-5 w-5" />
      </span>
      <p className="mt-5 text-sm font-black text-[#607198]">{label}</p>
      <p className="mt-2 text-3xl font-black text-[#0b2463]">{value}</p>
    </div>
  );
}

type ApprovalStatus = "pending" | "approved" | "rejected";
type ShopStatus = "pending" | "active" | "suspended";

function normalizeApproval(status?: string | null): ApprovalStatus {
  if (status === "pending" || status === "approved" || status === "rejected") return status;
  return "approved";
}

function approvalLabel(status: ApprovalStatus) {
  if (status === "pending") return "Chờ duyệt";
  if (status === "rejected") return "Từ chối";
  return "Đã duyệt";
}

function approvalClass(status: ApprovalStatus) {
  if (status === "pending") return "bg-honey/40 text-[#935b00]";
  if (status === "rejected") return "bg-blush/70 text-[#8d2845]";
  return "bg-mint/70 text-[#17664f]";
}

function normalizeShopStatus(status?: string | null): ShopStatus {
  if (status === "pending" || status === "active" || status === "suspended") return status;
  return "active";
}

function shopStatusLabel(status: ShopStatus) {
  if (status === "pending") return "Chờ admin duyệt";
  if (status === "suspended") return "Shop bị khóa";
  return "Shop đang hoạt động";
}

function shopStatusClass(status: ShopStatus) {
  if (status === "pending") return "bg-honey/40 text-[#935b00]";
  if (status === "suspended") return "bg-blush/70 text-[#8d2845]";
  return "bg-mint/70 text-[#17664f]";
}

function statusLabel(order: Order) {
  if (order.status === "cancelled") return "Đã hủy";
  if (order.paymentStatus === "processing") return "Chờ thanh toán";
  if (order.status === "confirmed") return "Đã xác nhận";
  return "Chờ xác nhận";
}

function statusClass(order: Order) {
  if (order.status === "cancelled") return "bg-blush/70 text-[#8d2845]";
  if (order.paymentStatus === "processing") return "bg-[#efe9ff] text-[#6d42ff]";
  if (order.status === "confirmed") return "bg-mint/70 text-[#17664f]";
  return "bg-honey/35 text-[#935b00]";
}

function paymentLabel(method?: string) {
  if (method === "bank_transfer") return "Chuyển khoản";
  if (method === "qr") return "Thanh toán QR";
  return "Thanh toán khi nhận hàng";
}

function paymentStatusLabel(status?: string) {
  if (status === "processing") return "Chờ xác nhận thanh toán";
  if (status === "paid") return "Đã thanh toán";
  if (status === "failed") return "Thanh toán thất bại";
  return "Chờ thanh toán";
}
