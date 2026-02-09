# BlueAlly Web and Mobile Styling Guide

## 1. Introduction

This document provides a comprehensive set of styling instructions for creating web and mobile applications that align with the BlueAlly brand identity. These guidelines are derived from the official BlueAlly Brand Guidelines and are intended to ensure a consistent and professional user experience across all digital platforms. By adhering to these standards, we can reinforce brand recognition and maintain a cohesive visual language.

This guide is intended for designers, developers, and anyone involved in the creation of BlueAlly's digital products. It covers all essential brand elements, from logo and color usage to typography and component styling, providing the necessary specifications for implementation.

## 2. Logo Usage

The BlueAlly logo is a critical component of the brand's identity and must be used consistently and correctly. The primary logo consists of a custom icon and the "BlueAlly" wordmark. The icon, a stylized 'A' forming a forward-facing arrow, should always be positioned to the right of the wordmark.

| Aspect | Guideline |
| --- | --- |
| **Clear Space** | A minimum clear space, equal to the width of the "B" in the BlueAlly logo, must be maintained around the logo to ensure its visibility and impact. |
| **Minimum Size** | For screen applications, the minimum width of the full logo is 145 pixels. The icon-only version can be used at a minimum size of 40x40 pixels. |
| **Placement** | The logo should be placed in a prominent position, typically in the header of the application. |

### Incorrect Usage

To maintain the integrity of the BlueAlly brand, the logo must not be altered in any way. The following modifications are strictly prohibited:

*   Altering the proportions, color, or orientation of the logo.
*   Applying any visual effects such as shadows, glows, or bevels.
*   Placing the logo on a busy or cluttered background that compromises its legibility.
*   Using the full-color logo on dark backgrounds; the two-tone white or full-white versions should be used instead.

## 3. Color Palette

The BlueAlly color palette is designed to be professional, energetic, and trustworthy. The consistent use of these colors is essential for maintaining brand recognition.

### Primary Colors

| Color | Hex | RGB | CMYK | Pantone |
| --- | --- | --- | --- | --- |
| Navy Blue | #001278 | 0, 18, 120 | 100, 92, 29, 17 | 662 C |
| Bright Blue | #02a2fd | 2, 162, 250 | 68, 27, 0, 0 | 2925 C |
| Black | #040822 | 4, 8, 34 | 86, 79, 56, 74 | 7547 C |
| Green | #36bf78 | 54, 191, 120 | 71, 0, 72, 0 | 7479 C |
| White | #ffffff | 255, 255, 255 | 0, 0, 0, 0 | N/A |
| Light Blue | #cde5f1 | 205, 229, 241 | 18, 3, 2, 0 | 642 C |

### Color Usage and Accessibility

To ensure readability and compliance with Web Content Accessibility Guidelines (WCAG), it is crucial to use color combinations that provide sufficient contrast. The following table outlines the approved text and background color pairings:

| Background Color | Permitted Text Colors |
| --- | --- |
| Black (#040822) | White, Light Blue, Green, Bright Blue |
| Navy Blue (#001278) | White, Light Blue, Green, Bright Blue |
| Bright Blue (#02a2fd) | Navy Blue, Black |
| Green (#36bf78) | Navy Blue, Black |
| Light Blue (#cde5f1) | Navy Blue, Black |
| White (#ffffff) | Navy Blue, Black |

## 4. Typography

The primary typeface for the BlueAlly brand is **DM Sans**. This sans-serif font is chosen for its simple, lightweight, and approachable feel. It should be used for all text content in web and mobile applications.

### Font Weights and Usage

| Weight | Usage |
| --- | --- |
| **DM Sans Bold** | Used for emphasis, headings, and call-to-action buttons. |
| DM Sans Medium | Suitable for subheadings and important text. |
| DM Sans Regular | The standard weight for all body copy and paragraph text. |
| DM Sans Light | Can be used for secondary or less important text. |

Headings should be written in mixed-case (title case or sentence case), not all caps, to maintain the approachable tone of the brand.

## 5. Brand Elements

The BlueAlly brand utilizes a distinctive visual language derived from the logo mark. These elements, characterized by their dynamic curves and angular shapes, should be used to create a visually engaging and consistent user experience.

### Brand Element Masking

The logo mark can be scaled and used as a mask to create interesting visual effects. The negative space created by the logo mark can also be used as a design element. This technique is particularly effective for headers, cover pages, and other large visual areas.

### Image Masking

Individual shapes from the logo mark can be used to mask images, creating dynamic and angular compositions. When using this technique, ensure that the subject of the photograph remains clearly visible within the masked area.

## 6. Imagery and Photography

Photography plays a crucial role in conveying the BlueAlly brand's story. Images should be professional, diverse, and showcase people benefiting from BlueAlly's services.

### Image Overlays

Color overlays can be applied to images to improve text legibility, particularly in hero sections. The primary overlay colors are **Light Blue** and **Deep Navy** at 80% opacity. Text should only be placed over the Deep Navy overlay and must be white.

## 7. Component Styling

This section provides detailed styling specifications for common UI components.

### Buttons

| State | Background Color | Text Color | Border |
| --- | --- | --- | --- |
| **Primary** | Bright Blue (#02a2fd) | White (#ffffff) | None |
| **Secondary** | Navy Blue (#001278) | White (#ffffff) | None |
| **Tertiary** | White (#ffffff) | Navy Blue (#001278) | 1px solid Navy Blue (#001278) |
| **Hover** | Darken the background color by 10% | White (#ffffff) | None |
| **Disabled** | Light Blue (#cde5f1) | White (#ffffff) | None |

### Forms

*   **Input Fields**: Should have a white background, a 1px solid border in Light Blue (#cde5f1), and a border-radius of 4px.
*   **Labels**: Should use DM Sans Medium in Black (#040822).
*   **Focus State**: When an input field is in focus, the border color should change to Bright Blue (#02a2fd).

### Navigation

*   **Header**: The application header should have a white background.
*   **Links**: Navigation links should use DM Sans Regular in Navy Blue (#001278). The active link should be highlighted using DM Sans Bold and the Bright Blue color.

### Cards

Cards should have a white background, a subtle box-shadow, and a border-radius of 8px. They can be used to display a variety of content, such as articles, products, or services.

## 8. Layout and Spacing

A consistent spacing system is crucial for creating a visually balanced and harmonious layout. The following spacing scale, based on a 4px grid, should be used throughout the application:

*   **4px**: Small gaps, icon padding.
*   **8px**: Gaps between small elements.
*   **16px**: Gaps between larger elements, component padding.
*   **24px**: Section padding.
*   **32px**: Gaps between sections.
*   **48px**: Page margins.

## 9. Mobile Responsiveness

All web and mobile applications must be fully responsive and provide an optimal user experience on all screen sizes. A mobile-first approach is highly recommended. The layout, components, and typography should adapt gracefully to different viewports.

## 10. Accessibility (A11y)

BlueAlly is committed to creating inclusive digital experiences. All applications must adhere to the Web Content Accessibility Guidelines (WCAG) 2.1 AA standards. This includes:

*   Ensuring sufficient color contrast.
*   Providing alternative text for all images.
*   Ensuring all functionality is accessible via the keyboard.
*   Using semantic HTML to structure content correctly.

By following these guidelines, we can create web and mobile applications that are not only visually appealing and on-brand but also accessible and user-friendly for everyone.
