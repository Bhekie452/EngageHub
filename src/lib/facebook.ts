
/**
 * Facebook OAuth & Graph API Utility
 */

const FB_APP_ID = '1621732999001688';

export const initFacebookSDK = () => {
    return new Promise((resolve) => {
        (window as any).fbAsyncInit = function () {
            (window as any).FB.init({
                appId: FB_APP_ID,
                cookie: true,
                xfbml: true,
                version: 'v21.0'
            });
            console.log('Facebook SDK Initialized');
            resolve(true);
        };

        (function (d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s) as any; js.id = id;
            js.src = "https://connect.facebook.net/en_US/sdk.js";
            fjs.parentNode?.insertBefore(js, fjs);
        }(document, 'script', 'facebook-jssdk'));
    });
};

export const loginWithFacebook = () => {
    return new Promise((resolve, reject) => {
        if (!(window as any).FB) {
            reject('Facebook SDK not loaded');
            return;
        }
        (window as any).FB.login((response: any) => {
            if (response.authResponse) {
                resolve(response.authResponse);
            } else {
                reject('User cancelled login or did not fully authorize.');
            }
        }, {
            scope: 'pages_manage_posts,pages_read_engagement,public_profile'
        });
    });
};

export const getPageTokens = (userAccessToken: string) => {
    return new Promise((resolve, reject) => {
        (window as any).FB.api('/me/accounts', { access_token: userAccessToken }, (response: any) => {
            if (response && !response.error) {
                resolve(response.data);
            } else {
                reject(response.error);
            }
        });
    });
};
