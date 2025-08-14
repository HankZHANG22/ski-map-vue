export type Resort = {
  id: number; country: string; name: string;
  lat: number; lng: number;
  difficulty: 'Beginner'|'Intermediate'|'Advanced';
  price: number; info: string; ticket_url: string;
}

export const RESORTS: Resort[] = [
  {id:1, country:"Japan", name:"Niseko United", lat:42.8048, lng:140.6874, difficulty:"Advanced", price:120, info:"Powder heaven in Hokkaido.", ticket_url:"https://www.niseko.ne.jp/en/"},
  {id:2, country:"Japan", name:"Hakuba Happo-One", lat:36.6973, lng:137.8605, difficulty:"Advanced", price:90, info:"Nagano Olympic venue.", ticket_url:"https://www.happo-one.jp/en/"},
  {id:3, country:"France", name:"Chamonix-Mont-Blanc", lat:45.9237, lng:6.8694, difficulty:"Advanced", price:75, info:"Extreme terrain by Mont Blanc.", ticket_url:"https://www.chamonix.com/"},
  {id:4, country:"France", name:"Les 3 Vallées", lat:45.381, lng:6.637, difficulty:"Intermediate", price:78, info:"Largest linked ski area.", ticket_url:"https://www.les3vallees.com/"},
  {id:5, country:"Switzerland", name:"Zermatt (Matterhorn)", lat:46.0207, lng:7.7491, difficulty:"Intermediate", price:95, info:"Year-round glacier skiing.", ticket_url:"https://www.zermatt.ch/en"},
  {id:6, country:"Austria", name:"St. Anton am Arlberg", lat:47.1289, lng:10.2718, difficulty:"Advanced", price:85, info:"Birthplace of modern skiing.", ticket_url:"https://www.stantonamarlberg.com/"},
  {id:7, country:"USA", name:"Vail", lat:39.6403, lng:-106.3742, difficulty:"Intermediate", price:200, info:"Colossal Colorado resort.", ticket_url:"https://www.vail.com/"},
  {id:8, country:"USA", name:"Jackson Hole", lat:43.5875, lng:-110.827, difficulty:"Advanced", price:185, info:"Steep & deep legend.", ticket_url:"https://www.jacksonhole.com/"},
  {id:9, country:"Canada", name:"Whistler Blackcomb", lat:50.115, lng:-122.948, difficulty:"Intermediate", price:190, info:"Largest in North America.", ticket_url:"https://www.whistlerblackcomb.com/"},
  {id:10, country:"China", name:"Wanlong (Chongli)", lat:40.9838, lng:115.3506, difficulty:"Intermediate", price:70, info:"High-quality groomers near Beijing.", ticket_url:"https://www.wlski.com/"},
  {id:11, country:"Italy", name:"Cortina d'Ampezzo", lat:46.5405, lng:12.1357, difficulty:"Intermediate", price:80, info:"Dolomites queen.", ticket_url:"https://www.dolomitisuperski.com/"},
  {id:12, country:"Andorra", name:"Grandvalira", lat:42.576, lng:1.664, difficulty:"Beginner", price:65, info:"Family-friendly Pyrenees.", ticket_url:"https://www.grandvalira.com/"}
]