import json
import pickle
from datetime import datetime, timedelta, timezone
import requests
from airflow.models import Variable
from settings.global_config import DATA_PATH, PROXIES

FILE_NAME = "che_token.pickle"

class CHEAuth:
    """
    The class for authenticating with the CHE API.
    The class loads the password from the Airflow variables.
    The access token is saved to a file for reuse.
    """

    def __init__(self):
        self.password = Variable.get("CHE_PASSWORD")
        self.full_file_path = f"{DATA_PATH}/{FILE_NAME}"

	@staticmethod
 	def get_token(self, now_time ,is_proxy=True, timeout=60):
        """
        Get the access token for authentication.
        This method retrieves the access token from the specified path.
        If the token is not found or has expired, a new token is obtained and saved to the path.

        Args:
            is_proxy (bool): Flag indicating whether to use a proxy. Defaults to True.
            timeout (int): The timeout for the request. Defaults to 60.

        Returns:
            str: The access token.

        Raises:
            FileNotFoundError: If the token file is not found.
            EOFError: If the token file is empty or corrupted.
        """
        # Check if the token is expired
        try:
            with open(self.full_file_path, "rb") as handle:
                res = pickle.load(handle)
                expired_time = res["time_out"]
                if now_time < expired_time:  # If the token is not expired
                    return res["access_token"]
        except (FileNotFoundError, EOFError):
            pass

        # Get the token
        url = "https://crowds.hinet.net/webapi/api/Login"
        payload = json.dumps({
            "id": "taipeieventapi",
            "pass": self.password
        })
        headers = {
            'Content-Type': 'application/json'
        }
        with requests.post(
            url,
            headers=headers,
            data=payload,
            proxies=PROXIES if is_proxy else None,
            timeout=timeout
        ) as response:
            res_json = response.json()
            print(f"Response JSON: {res_json}")
            token = res_json["access_token"]
            expired_time = now_time + timedelta(seconds=res_json["expires_in"])
            res = {"access_token": token, "expired_time": expired_time}

        # Save the token
        with open(self.full_file_path, "wb") as handle:
            pickle.dump(res, handle)

        return token
