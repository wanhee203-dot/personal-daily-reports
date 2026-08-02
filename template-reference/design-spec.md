# Personal Daily Report Visual Specification

## Authority

- Figma is the visual design reference.
- React/CSS is the production rendering implementation.
- The daily CLI does not call Figma.

## Frame

- Width: 1080 px
- Minimum height: 1920 px
- Background: `#F2F3F5`
- Horizontal padding: 72 px
- Vertical padding: 72 px
- Major section gap: 28 px

## Header

- Background: `#16588F`
- Radius: 16 px
- Padding: 36 px 40 px
- Minimum height: 282 px
- Main title: 42 px, weight 700, line height 1.2

## Project Card

- Background: `#FFFFFF`
- Border: `1px solid #DCE4EB`
- Radius: 10 px
- Padding: 28 px 32 px
- Internal gap: 18 px
- Height: automatic

## Typography

- Windows runtime stack: `"Microsoft YaHei", "Segoe UI", sans-serif`
- Project title: 24 px, weight 700, line height 1.35
- Body: 15 px, line height 1.7
- Labels: 10–11 px, weight 700–800

## Status Colors

- Completed: `#E6F4EA` / `#297A43`
- In progress: `#FFF2D8` / `#A86800`
- Planned: `#E7F0F8` / `#35698F`
- Blocked: `#FCE8E6` / `#A33A30`

## Long Content

- Do not reduce the font size.
- Do not crop cards or text.
- Do not paginate in v0.1.0.
- Grow the page vertically.
