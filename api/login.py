import requests
from bs4 import BeautifulSoup

LOGIN_URL = "https://cait.tdtu.edu.vn/elearning/login/index.php"
PROFILE_URL = "https://cait.tdtu.edu.vn/elearning/user/profile.php"

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

    # Scrape profile
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

    return {
        "fullname": fullname or "Không tìm thấy",
        "email": get_dd("Email address") or get_dd("Thư điện tử"),
        "country": get_dd("Country") or get_dd("Quốc gia"),
        "city": get_dd("City/town") or get_dd("Tỉnh/Thành phố"),
        "timezone": get_dd("Timezone") or get_dd("Múi giờ"),
        "first_access": get_dd("First access to site") or get_dd("Lần đầu tiếp cận trang web"),
        "last_access": get_dd("Last access to site") or get_dd("Lần truy cập gần nhất vào trang"),
    }
