<a name="readme-top"></a>

<!-- PROJECT LOGO -->
<div align="center">
<!-- light.png -->
    <img src="images/logos/logo-stencil/dark-removebg-preview.png" alt="Logo" width="200" height="200" style="border-radius: 5px; box-shadow: 0 0 120px 0 rgba(239, 138, 255, 0.5); padding: 15px;">

### Celerity

  <p>
    Press, enter, done.
    <br />
    <br />
    <a href="https://chadprobert.github.io/custom-new-tab/">View Demo</a>
    »
    <a href="https://github.com/ChadProbert/new-page-app/issues">Report Bug</a>
    »
    <a href="https://github.com/ChadProbert/new-page-app/pulls">Request Feature</a>
  </p>

  <!-- SHIELDS.IO -->

![GitHub repo size](https://img.shields.io/github/repo-size/ChadProbert/new-page-app)
![GitHub last commit](https://img.shields.io/github/last-commit/ChadProbert/new-page-app)
![GitHub issues](https://img.shields.io/github/issues-raw/ChadProbert/new-page-app)
![GitHub pull requests](https://img.shields.io/github/issues-pr/ChadProbert/new-page-app)
![GitHub Repo stars](https://img.shields.io/github/stars/ChadProbert/new-page-app?style=social)

#### Tech Stack:

<!-- Add padding to the badges -->

![HTML5](https://img.shields.io/badge/HTML5-red?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS-blue?&style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-yellow?style=flat&logo=javascript&logoColor=white)

</div>

<br/>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-app">About The App</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
        <li><a href="#setup">Setup</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#modifying-the-app">Modifying The App</a></li>
    <li><a href="#contributors">Contributors</a></li>
  </ol>
</details>

<br/>

## About The App

Celerity is a productivity-focused custom new tab page that transforms browser navigation with powerful keyboard shortcuts.

It allows you to:

- **Rapidly access sites** with simple key commands (press a key, hit enter, done)
- **Direct search from any site** by typing a key followed by your query
- **Customise shortcuts** to match your workflow needs
- **Switch between themes** including dark mode, light mode, and developer-inspired colour schemes
- **Configure settings** including tab behaviour and search engine preferences

It is designed for keyboard-centric users who value efficiency and minimalism. Celerity eliminates the need for bookmarks and reduces repetitive navigation to frequently visited sites.

<br/>

## Getting Started

### Installation

<!-- Add links once published to the Chrome Web Store:

Chrome Web Store:
```
[Link to Celerity on Chrome Web Store]
```

Firefox Add-ons:
```
[Link to Celerity on Firefox Add-ons]
``` -->

For development:

```sh
git clone https://github.com/ChadProbert/celerity.git
```

<br/>

## Usage

<br>
<br>

<img src="images/themes/dark.jpg" alt="Celerity Logo" width="1000" style="border-radius: 5px; box-shadow: 0 0 120px 0 rgba(239, 138, 255, 0.5);">

### Basic Navigation

To visit a site, type its keyboard shortcut and press enter:

- `g` ➜ Gmail
- `r` ➜ Reddit
- `y` ➜ YouTube

### Site Search

Type a space after a site's shortcut to search directly on that site:

- `y JavaScript` ➜ Searches YouTube for "JavaScript" videos
- `a Why is JavaScript so popular?` ➜ Prompts ChatGPT with a question
- `s Lofi coding` ➜ Searches Spotify for "Lofi coding" songs

### Path Navigation

Navigate to specific paths:

- `r/r/webdev` ➜ Navigates to Reddit's /r/webdev subreddit
- `y/feed/subscriptions` ➜ Navigates to your YouTube subscription feed

### Default Search

If your input doesn't match any shortcut, Celerity performs a Google search:

- `hello world javascript` ➜ Searches Google for "hello world javascript"

<br />

## Customising Celerity

### Shortcut Management

Add, edit, or remove shortcuts.

<img src="images/settings-interface.jpg" alt="Celerity Logo" width="1000" style="border-radius: 5px; box-shadow: 0 0 120px 0 rgba(239, 138, 255, 0.5);">

### Theme Selection

Choose from several built-in themes including Dark, Light, One Dark Pro, Catppuccin and GitHub themes.

<div align="center">
  <table>
    <tr>
      <td align="center">
        <strong>Dark Abyss</strong><br/>
        <img src="images/themes/dark-abyss2.jpg" alt="Dark Abyss Theme" width="400" style="border-radius: 2px;">
      </td>
      <td align="center">
        <strong>Light Theme</strong><br/>
        <img src="images/themes/light.jpg" alt="Light Theme" width="400" style="border-radius: 2px;">
      </td>
    </tr>
    <tr>
      <td align="center">
        <strong>One Dark Pro</strong><br/>
        <img src="images/themes/one-dark-pro.jpg" alt="One Dark Pro Theme" width="400" style="border-radius: 2px;">
      </td>
      <td align="center">
        <strong>Catppuccin (Frappe)</strong><br/>
        <img src="images/themes/catppuccin-frappe.jpg" alt="Catppuccin Frappe Theme" width="400" style="border-radius: 2px;">
      </td>
    </tr>
    <tr>
      <td align="center">
        <strong>Catppuccin (Macchiato)</strong><br/>
        <img src="images/themes/catppuccin-macchiato.jpg" alt="Catppuccin Macchiato Theme" width="400" style="border-radius: 2px;">
      </td>
      <td align="center">
        <strong>Catppuccin (Mocha)</strong><br/>
        <img src="images/themes/catppuccin-mocha.jpg" alt="Catppuccin Mocha Theme" width="400" style="border-radius: 2px;">
      </td>
    </tr>
     <tr>
      <td align="center">
        <strong>GitHub Dark</strong><br/>
        <img src="images/themes/github-dark.jpg" alt="GitHub Dark Theme" width="400" style="border-radius: 2px;">
      </td>
      <td align="center">
        <strong>GitHub High Contrast</strong><br/>
        <img src="images/themes/github-high-contrast.jpg" alt="GitHub Dark Theme" width="400" style="border-radius: 2px;">
      </td>
    </tr>
  </table>
</div>

<br/>

## Contributors

[<img src="https://github.com/ChadProbert.png" width="50px"/>](https://github.com/ChadProbert/)
<br />
<br />
<br />

<p align="center"><a href="#readme-top">(back to top)</a></p>
