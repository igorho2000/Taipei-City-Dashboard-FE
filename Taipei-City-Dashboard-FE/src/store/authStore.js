// Developed by Taipei Urban Intelligence Center 2023-2024

/* authStore */
/*
The authStore stores authentication and user information.
*/

import { defineStore } from "pinia";
import http from "../router/axios";
import router from "../router/index";
import { useContentStore } from "./contentStore";
import { useDialogStore } from "./dialogStore";
import { useMapStore } from "./mapStore";

export const useAuthStore = defineStore("auth", {
	state: () => ({
		// This is a shortened version of the user object Taipei City Dashboard's backend will return once authenticated
		user: {
			user_id: null,
			account: "",
			name: "",
			is_active: null,
			is_whitelist: null,
			is_blacked: null,
			login_at: null,
			is_admin: false,
		},
		editUser: {},
		accessKey: null,
		taipeiPass: null,
		errorMessage: "",
		isMobileDevice: false,
		isNarrowDevice: false,
		currentPath: "",
	}),
	getters: {},
	actions: {
		/* Authentication Functions */
		// 1. Initial Checks
		async initialChecks() {
			const contentStore = useContentStore();
			const mapStore = useMapStore();
			// Check if the user is using a mobile device
			this.checkIfMobile();

			// Check if the user is logged in
			if (localStorage.getItem("accessKey")) {
				this.accessKey = localStorage.getItem("accessKey");
				if (localStorage.getItem("taipeiPass")) {
					this.taipeiPass = localStorage.getItem("taipeiPass");
				}
				const response = await http.get("/user/me");
				this.user = response.data.user;
				if (this.user?.user_id) {
					mapStore.fetchViewPoints();
				}
				this.editUser = JSON.parse(JSON.stringify(this.user));
			}

			contentStore.setContributors();
		},
		// 2. Email Login
		async loginByEmail(email, password) {
			const response = await http.post(
				"/auth/login",
				{},
				{
					auth: {
						username: email,
						password: password,
					},
				}
			);
			this.handleSuccessfullLogin(response);
		},
		// 3. Taipei Pass Login
		async loginByTaipeiPass(code) {
			try {
				// Validate code parameter
				if (!code || typeof code !== 'string') {
					throw new Error("Invalid authentication code");
				}
				
				// Sanitize and encode input parameter
				const sanitizedCode = encodeURIComponent(code.trim());

				const response = await http.get("/auth/callback", {
					params: {
						code: sanitizedCode,
					},
				});
				this.handleSuccessfullLogin(response);
				router.replace("/dashboard");
			} catch {
				router.replace("/dashboard");
			}
		},
		// 4. Tasks to be completed after login
		handleSuccessfullLogin(response) {
			const dialogStore = useDialogStore();
			const contentStore = useContentStore();

			this.accessKey = response.data.token;
			localStorage.setItem("accessKey", this.accessKey);
			if (response.data.isso_token) {
				this.taipeiPass = response.data.isso_token;
				localStorage.setItem("taipeiPass", this.taipeiPass);
			}
			this.user = response.data.user;
			this.editUser = JSON.parse(JSON.stringify(this.user));

			contentStore.publicDashboards = [];
			router.go();
			dialogStore.showNotification("success", "登入成功");
		},
		// 5. Logout
		async handleLogout() {
			const dialogStore = useDialogStore();
			const contentStore = useContentStore();

			localStorage.removeItem("accessKey");
			this.user = {};
			this.editUser = {};
			this.accessKey = null;

			contentStore.publicDashboards = [];

			if (this.taipeiPass) {
				await http.post(
					"/auth/logout",
					{},
					{
						params: {
							isso_token: this.taipeiPass,
						},
					}
				);
				localStorage.removeItem("taipeiPass");
				this.taipeiPass = null;
			}

			router.go();
			dialogStore.showNotification("success", "登出成功");
		},
		// 6. If your authentication system supports refresh tokens, call this function to refresh existing tokens
		executeRefreshTokens() {},

		/* User Info Functions */
		// 1. Update User Info
		async updateUserInfo() {
			await http.patch("/user/me", this.editUser);
			const response = await http.get("/user/me");
			this.user = response.data.user;
			this.editUser = JSON.parse(JSON.stringify(this.user));
		},

		/* Other Utility Functions */
		// 1. Check if the user is using a mobile device.
		// This is used to determine whether to show the mobile version of the dashboard.
		checkIfMobile() {
			if (navigator.maxTouchPoints > 2) {
				this.isMobileDevice = true;
			}
			if (window.matchMedia("(pointer:fine)").matches) {
				this.isMobileDevice = false;
			}
			if (window.screen.width < 750) {
				this.isNarrowDevice = true;
			}
		},
		// 2. Set the current path of the user
		setCurrentPath(path) {
			this.currentPath = path;
		},
	},
});
