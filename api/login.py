import requests
from bs4 import BeautifulSoup

LOGIN_URL = "https://cait.tdtu.edu.vn/elearning/login/index.php"
PROFILE_URL = "https://cait.tdtu.edu.vn/elearning/user/profile.php"
EDIT_PROFILE_URL = "https://cait.tdtu.edu.vn/elearning/user/edit.php"

def scrape_profile(username: str, password: str):
    """
    Returns dict with profile data or raises exception on failure.
    """
    session = requests.Session()
    session.headers.update({"User-Agent": "Mozilla/5.0"})

    # Get login token
    r = session.get(LOGIN_URL)
    soup = BeautifulSoup(r.text, "html.parser")
    token_input = soup.find("input", {"name": "logintoken"})
    
    if not token_input:
        raise Exception("Could not find login token")
    
    token = token_input["value"]

    # Perform login
    login_response = session.post(LOGIN_URL, data={
        "username": username,
        "password": password,
        "logintoken": token
    })

    # Scrape basic profile
    r_profile = session.get(PROFILE_URL)
    soup = BeautifulSoup(r_profile.text, "html.parser")

    fullname = None
    profile_card = soup.find("div", class_="card-profile")
    if profile_card:
        h3 = profile_card.find("h3")
        if h3:
            fullname = h3.get_text(strip=True)

    def get_dd(label):
        dt = soup.find("dt", string=label)
        if dt:
            return dt.find_next_sibling("dd").get_text(strip=True)
        return None

    # Scrape edit profile page for additional fields
    r_edit = session.get(EDIT_PROFILE_URL)
    edit_soup = BeautifulSoup(r_edit.text, "html.parser")
    
    # Extract lastname (Họ)
    lastname_input = edit_soup.find("input", {"id": "id_lastname"})
    lastname = lastname_input.get("value", "") if lastname_input else ""
    
    # Extract firstname (Tên đệm và tên)
    firstname_input = edit_soup.find("input", {"id": "id_firstname"})
    firstname = firstname_input.get("value", "") if firstname_input else ""
    
    # Extract email
    email_input = edit_soup.find("input", {"id": "id_email"})
    email = email_input.get("value", "") if email_input else ""
    
    # Combine lastname and firstname for fullname if not found earlier
    if not fullname or fullname == "Không tìm thấy":
        if lastname and firstname:
            fullname = f"{lastname} {firstname}"

    return {
        "fullname": fullname or "Không tìm thấy",
        "firstname": firstname,
        "lastname": lastname,
        "email": email or get_dd("Email address") or get_dd("Thư điện tử"),
        "country": get_dd("Country") or get_dd("Quốc gia"),
        "city": get_dd("City/town") or get_dd("Tỉnh/Thành phố"),
        "timezone": get_dd("Timezone") or get_dd("Múi giờ")
    }
