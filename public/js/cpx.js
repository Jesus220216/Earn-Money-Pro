/**
 * CPX Research Integration for EarnPro
 * This script handles the configuration and initialization of CPX Research offerwalls.
 */

export function initCPX(userId) {
    if (!userId) return;

    // CPX Research Configuration
    const script1 = {
        div_id: "cpx-fullscreen",
        theme_style: 1, // Fullscreen
        order_by: 2,    // Best money
        limit_surveys: 7
    };

    const script4 = {
        div_id: "cpx-notification",
        theme_style: 4,
        position: 5, // bottom right
        text: "¡Nueva encuesta disponible!",
        link: "",
        newtab: true
    };

    const config = {
        general_config: {
            app_id: 32365, // Using the AdGem app_id as placeholder or user should provide one
            ext_user_id: userId,
            email: "",
            username: "",
            secure_hash: "",
            subid_1: "",
            subid_2: "",
        },
        style_config: {
            text_color: "#e5e7eb",
            survey_box: {
                topbar_background_color: "#10B981",
                box_background_color: "#1f2937",
                rounded_borders: true,
                stars_filled: "#F59E0B",
            },
        },
        script_config: [script1, script4],
        debug: false,
        useIFrame: true,
        iFramePosition: 1,
        functions: {
            no_surveys_available: () => {
                console.log("CPX: No surveys available");
            },
            count_new_surveys: (count) => {
                console.log("CPX: New surveys count:", count);
            },
            get_all_surveys: (surveys) => {
                console.log("CPX: All surveys:", surveys);
            },
            get_transaction: (transactions) => {
                console.log("CPX: Transactions:", transactions);
            }
        }
    };

    window.config = config;

    // Load CPX Script
    const script = document.createElement('script');
    script.src = "https://sdk.cpx-research.com/index.js";
    script.async = true;
    document.body.appendChild(script);
}
