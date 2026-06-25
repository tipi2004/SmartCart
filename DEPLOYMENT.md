# Deploy SmartCart

SmartCart nen deploy theo huong:

- Frontend Next.js: Vercel
- Backend Spring Boot: Render
- Database PostgreSQL: Supabase hoac Render PostgreSQL
- Image upload: Cloudinary

## 1. Tao database cloud

Tao PostgreSQL tren Supabase hoac Render. Sau do lay cac thong tin:

- Host
- Port
- Database name
- Username
- Password

Bien `DB_URL` cho Spring Boot co dang:

```env
DB_URL=jdbc:postgresql://HOST:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

Neu dung Render PostgreSQL, co the can doi database name theo thong tin Render cap.

## 2. Deploy backend tren Render

Tao Web Service moi va chon repository SmartCart.

Thiet lap:

```text
Root Directory: SmartCart-BE
Build Command: mvn clean package -DskipTests
Start Command: java -jar target/smartcart-be-0.0.1-SNAPSHOT.jar
```

Them Environment Variables:

```env
DB_URL=jdbc:postgresql://HOST:5432/postgres?sslmode=require
DB_USERNAME=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_long_random_secret
FRONTEND_URL=https://your-smartcart-frontend.vercel.app
BACKEND_URL=https://your-smartcart-backend.onrender.com
CORS_ALLOWED_ORIGINS=https://your-smartcart-frontend.vercel.app,http://localhost:3000
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_key
MAIL_USERNAME=your_gmail@gmail.com
MAIL_PASSWORD=your_gmail_app_password
MAIL_FROM=your_gmail@gmail.com
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

Sau khi deploy xong, test:

```text
https://your-smartcart-backend.onrender.com/swagger-ui.html
```

## 3. Deploy frontend tren Vercel

Import repository vao Vercel.

Thiet lap:

```text
Root Directory: SmartCart-FE
Build Command: npm run build
Output: mac dinh Next.js
```

Them Environment Variables:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-smartcart-backend.onrender.com/api
NEXT_PUBLIC_APP_URL=https://your-smartcart-frontend.vercel.app
```

Deploy xong, quay lai Render cap nhat:

```env
FRONTEND_URL=https://your-smartcart-frontend.vercel.app
CORS_ALLOWED_ORIGINS=https://your-smartcart-frontend.vercel.app,http://localhost:3000
```

## 4. Cau hinh Google OAuth

Trong Google Cloud Console, OAuth Client can them redirect URI:

```text
https://your-smartcart-backend.onrender.com/login/oauth2/code/google
```

Va JavaScript origin:

```text
https://your-smartcart-frontend.vercel.app
https://your-smartcart-backend.onrender.com
```

## 5. Luu y quan trong

- Render free co the bi sleep, lan mo dau se cham.
- Khong dua mat khau database, Gmail app password, Google secret len code.
- Anh upload nen dung Cloudinary. Neu khong cau hinh Cloudinary, anh se luu local tren backend va co the mat khi Render restart.
- QR don hang khi deploy se dung `NEXT_PUBLIC_APP_URL`. Neu URL sai, QR se tro ve sai domain.
