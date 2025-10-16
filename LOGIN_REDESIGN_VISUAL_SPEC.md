# Login Page - Visual Layout (Vietnamese Mode)

```
┌─────────────────────────────────────────────────────────────┐
│                                              [English] ←──┐  │
│                                                           │  │
│                         SeekWell                          │  │
│    Kiểm tra các nốt ruồi đáng ngờ ngay trên điện thoại   │  │
│                                                           │  │
│    ─────────────────────────────────────────────────      │  │
│                                                           │  │
│                  Bắt đầu kiểm tra da                      │  │
│                                                           │  │
│    ┌─────────────────────────────────────────────────┐   │  │
│    │ Điền họ và tên của bạn (nếu đây là lần đầu)    │   │  │
│    └─────────────────────────────────────────────────┘   │  │
│                                                           │  │
│    ┌─────────────────────────────────────────────────┐   │  │
│    │ Điền số điện thoại của bạn                      │   │  │
│    └─────────────────────────────────────────────────┘   │  │
│                                                           │  │
│    ┌─────────────────────────────────────────────────┐   │  │
│    │ Tạo mật khẩu dễ nhớ                             │   │  │
│    └─────────────────────────────────────────────────┘   │  │
│                                                           │  │
│    ┌─────────────────────────────────────────────────┐   │  │
│    │                  BẮT ĐẦU                        │   │  │
│    └─────────────────────────────────────────────────┘   │  │
│       (Green gradient button)                            │  │
│                                                           │  │
│    ┌─────────────────────────────────────────────────┐   │  │
│    │         Dùng thử không cần tài khoản           │   │  │
│    └─────────────────────────────────────────────────┘   │  │
│       (White button with green border)                   │  │
│                                                           │  │
└─────────────────────────────────────────────────────────────┘
```

## Element Spacing (Vertical Flow)

```
Top Padding: 20px
    ↓
Language Button (position: absolute)
    ↓
40px gap
    ↓
SeekWell Logo
    ↓
8px gap
    ↓
Tagline
    ↓
32px gap + border
    ↓
"Bắt đầu kiểm tra da" Title
    ↓
24px gap
    ↓
Full Name Input
    ↓
16px gap
    ↓
Phone Number Input
    ↓
16px gap
    ↓
Password Input
    ↓
24px gap
    ↓
BẮT ĐẦU Button
    ↓
16px gap
    ↓
Demo Button
    ↓
Bottom Padding: 40px
```

## Color Scheme

```
Background Gradient:
  From: #22c55e (SeekWell Primary Green)
  To:   #16a34a (Darker Green)

Card:
  Background: #FFFFFF (White)
  Border-radius: 24px
  Shadow: 0 20px 60px rgba(0,0,0,0.2)

Language Button:
  Text: #36a41d (SeekWell Primary)
  Hover Background: rgba(54,164,29,0.1)

Input Fields:
  Background: #f9fafb (Light Gray)
  Border: 2px solid #e5e7eb (Gray)
  Focus Border: #36a41d (SeekWell Primary)
  Text: #1e293b (Dark Gray)
  Placeholder: #9ca3af (Medium Gray)

Primary Button (BẮT ĐẦU):
  Background: linear-gradient(135deg, #36a41d 0%, #2d8a17 100%)
  Text: #FFFFFF (White)
  Shadow: 0 4px 15px rgba(54,164,29,0.3)

Secondary Button (Demo):
  Background: #FFFFFF (White)
  Border: 2px solid #36a41d (SeekWell Primary)
  Text: #36a41d (SeekWell Primary)
```

## Typography

```
Logo (SeekWell):
  Font-size: 2rem (32px)
  Font-weight: 700 (Bold)
  Color: Gradient (Primary → Dark Green)

Tagline:
  Font-size: 0.875rem (14px)
  Font-weight: 500 (Medium)
  Color: #64748b (Slate Gray)

Title (Bắt đầu kiểm tra da):
  Font-size: 1.5rem (24px)
  Font-weight: 600 (Semi-bold)
  Color: #1e293b (Dark Slate)

Input Placeholders:
  Font-size: 1rem (16px)
  Font-weight: 400 (Regular)
  Color: #9ca3af (Gray)

Buttons:
  Font-size: 1rem (16px)
  Font-weight: 600 (Semi-bold)
```

## Input Field Specifications

```
Full Name Field:
  Type: text
  ID: fullName
  Placeholder: Điền họ và tên của bạn (nếu đây là lần đầu)
  Required: No (optional)
  AutoComplete: name

Phone Number Field:
  Type: tel ← Important for mobile numeric keyboard!
  ID: phoneNumber
  Placeholder: Điền số điện thoại của bạn
  Required: Yes
  AutoComplete: tel

Password Field:
  Type: text ← Not "password"! Always visible
  ID: password
  Placeholder: Tạo mật khẩu dễ nhớ
  Required: Yes
  AutoComplete: current-password
```

## Button Behaviors

```
Language Button:
  Click → Toggles between 'vi' and 'en'
  Updates localStorage: 'preferredLanguage'
  
BẮT ĐẦU Button:
  1. Validates phone & password
  2. Attempts login with phone as username
  3. If 401 error:
     - Checks if full name is filled
     - Creates new account
     - Auto-logs in
  4. If success: Navigate to /dashboard

Demo Button:
  1. Immediately logs in with:
     - username: patient1@seekwell.health
     - password: PatientDemo2025
  2. Navigate to /dashboard
```

## Responsive Breakpoints

```
Small Mobile (≤ 375px):
  - Card padding: 24px
  - Logo font-size: 1.5rem
  - Title font-size: 1.25rem

Default Mobile (375px - 768px):
  - Card padding: 32px (as shown above)
  
Tablet & Desktop (≥ 768px):
  - Card max-width: 450px (centered)
  - Card padding: 48px
  - Background: fixed attachment
```

## Error State Display

```
When error occurs:

┌─────────────────────────────────────────────────┐
│ ⚠️ Số điện thoại hoặc mật khẩu không đúng       │
└─────────────────────────────────────────────────┘
  (Red gradient background with left border)
  
Position: Between password field and BẮT ĐẦU button
Animation: Shake on appearance
```

## Loading State

```
When loading (button disabled):

┌─────────────────────────────────────────────────┐
│         [spinner] Đang tải...                   │
└─────────────────────────────────────────────────┘

Spinner: Rotating circle (white color)
Button: Slightly transparent (opacity: 0.7)
Cursor: not-allowed
```

## Animation Effects

```
Card Entrance:
  - Animation: slideUp
  - Duration: 0.6s
  - Effect: Fades in + slides up 30px

Button Ripple:
  - On click: Circular ripple from click point
  - Duration: 0.6s
  - Color: rgba(255,255,255,0.2)

Language Button:
  - Hover: Background fades in
  - Active: Scale down to 0.95

Primary Button:
  - Hover: Moves up 2px + shadow increases
  - Disabled: No hover effects

Error Banner:
  - Animation: Shake
  - Duration: 0.5s
  - Movement: -5px, +5px horizontal
```

## Accessibility Features

```
Touch Targets:
  - All inputs: min-height 44px
  - All buttons: min-height 44px
  - Adequate spacing between elements

Focus States:
  - Inputs: Green border + shadow ring
  - Buttons: Visible outline

Keyboard Navigation:
  - Tab order: Name → Phone → Password → START → Demo
  - Enter submits form

Reduced Motion:
  - All animations disabled if user prefers
```

## Visual Hierarchy

```
1. SeekWell Logo (Largest, gradient)
   ↓
2. Tagline (Smaller, gray)
   ↓
3. Form Title (Bold, dark)
   ↓
4. Input Fields (Consistent size)
   ↓
5. Primary Action (Largest button, green)
   ↓
6. Secondary Action (Outlined button)
```

This creates a natural reading flow from top to bottom,
guiding users through the simplified interaction.

---

## Comparison to Old Design

### Removed Visual Elements:
- ❌ Globe icon dropdown menu
- ❌ "Chào Mừng Trở Lại" heading
- ❌ Subtitle text below heading
- ❌ Email label
- ❌ Password label
- ❌ Password show/hide button
- ❌ "Quên mật khẩu?" link
- ❌ "or" divider with lines
- ❌ Separate "Đăng Ký" button
- ❌ Demo credentials display box
- ❌ "Fill Demo Credentials" button

### Result:
**Cleaner, more focused design with 47% fewer interactive elements**
