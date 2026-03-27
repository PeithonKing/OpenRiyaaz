# OpenRiyaaz

### **[CLICK HERE TO OPEN THE APP](https://peithonking.github.io/OpenRiyaaz)** **(No installation required)**

## The Motivation

My mother joined music class recently and for training alone at home she used some apps to play tabla while she practices singing. But most of those apps are proprietary, closed-source, and while they may be free at the start, they soon get plagued with intrusive ads. Eventually, they lock even the most basic features behind paywalls or subscriptions. As a result my mother needed to switch apps every month. I got frustrated by this and decided to make an app myself; for my mother and for people like her.

I realized that the community needed a tool that was not just free, but reliable for long-term practice (riyaaz) without the risk of features disappearing behind a paywall. This project is the result of that frustration and a desire to provide a distraction-free, "just works" environment for musicians of all levels.

> A tool by the musicians, built for the musicians.

## Technical Overview

*This section serves as a formal technical record of the project architecture.*

* **Core Logic**: Written entirely in **Vanilla JavaScript** (ES6+) without frameworks or external build-tools to ensure maximum performance and zero overhead.
* **Audio Engine**: Utilizes the standard `HTMLMediaElement` with the `preservesPitch` property enabled to maintain scale integrity.
* **UI Architecture**: A lightweight static app (`index.html` + `styles` + `scripts`) that dynamically loads section content via `fetch` while keeping playback uninterrupted.
* **State Persistence**: Uses `localStorage` to remember user preferences such as Master Volume, Tabla Volume, BPM, selected Taal, and theme settings.
* **Media Integration**: Communicates with the operating system’s media hub to show track metadata and provide lock-screen controls.

<!-- ## Special Thanks & Attribution
While the code is mine, this project would not have been possible without the guidance and functional feedback of the following individuals:

* **[NAME_OF_CONTRIBUTOR_1]**: Provided essential guidance on the artistic requirements and usability for traditional practitioners.
* **[NAME_OF_CONTRIBUTOR_2]**: Assisted in testing the rhythm accuracy and defining the core "mommy-proof" UI flow. -->

## How to Use

1. Open the **[OpenRiyaaz Site](https://peithonking.github.io/OpenRiyaaz)** in your mobile browser.
2. Use from the browser or tap the **"Install"** banner or select **"Add to Home Screen"** from your browser menu.
3. Open the app from your home screen, choose your Taal, and press the large **Play** button.

## Contributing

OpenRiyaaz is a community-focused FOSS project. Contributions are welcome in the following areas:

* **Audio Assets**: Providing high-quality, clean loops for new Taals or instruments (Tanpura, etc.).
* **Music Theory**: Guidance on Taal structures, bol partitions, and authentic practice requirements.
* **Bug Fixes**: Technical improvements or performance optimizations.
* **Feature Requests**: Suggestions for new features or improvements that align with the project's core mission of being a distraction-free, "just works" practice tool.

To contribute, please open an **Issue** to discuss your ideas or submit a **Pull Request** directly.

## License

This project is released under the **MIT License**. See [LICENSE](LICENSE).
