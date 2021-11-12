// Create a google map search box element
const input = document.querySelector('input');
let button = document.querySelector('button');
const searchBox = new google.maps.places.SearchBox(input);
// Using the google Geocoding services
let geocoder;
geocoder = new google.maps.Geocoder();
// By default, get and display the weather info of local place
requestData('Taiwan', 23.69781, 120.960515);

// for carousel effect
const track = document.querySelector('.carousel__track');
const nextButton = document.querySelector('.carousel__button--right');
const prevButton = document.querySelector('.carousel__button--left');
const dotsNav = document.querySelector('.carousel__nav');

// move the slide when click
function moveToSlide(currentSlide, targetSlide) {
	const amountToMove = targetSlide.style.left;
	track.style.transform = `translateX(-${amountToMove})`;
	currentSlide.classList.remove('current-slide');
	targetSlide.classList.add('current-slide');
}

// move the dots when click
function moveToDot(currentDot, targetDot) {
	currentDot.classList.remove('current-slide');
	targetDot.classList.add('current-slide');
}

// remove arrow at edge slide
function hideArrow(targetIndex, trackLength) {
	if (targetIndex === 0) {
		prevButton.classList.add('is-hidden');
		nextButton.classList.remove('is-hidden');
	} else if (targetIndex === trackLength - 1) {
		prevButton.classList.remove('is-hidden');
		nextButton.classList.add('is-hidden');
	} else {
		prevButton.classList.remove('is-hidden');
		nextButton.classList.remove('is-hidden');
	}
}

// click left, move slides to the left
prevButton.addEventListener('click', event => {
	const currentSlide = track.querySelector('.current-slide');
	const prevSlide = currentSlide.previousElementSibling;
	const currentDot = dotsNav.querySelector('.current-slide');
	const prevDot = currentDot.previousElementSibling;
	const dots = Array.from(dotsNav.children);
	const dotsLength = dots.length;
	const targetIndex = dots.findIndex(dot => dot === prevDot);
	moveToSlide(currentSlide, prevSlide);
	moveToDot(currentDot, prevDot);
	hideArrow(targetIndex, dotsLength);
});

// click right, move slides to the right
nextButton.addEventListener('click', event => {
	const currentSlide = track.querySelector('.current-slide');
	const nextSlide = currentSlide.nextElementSibling;
	const currentDot = dotsNav.querySelector('.current-slide');
	const nextDot = currentDot.nextElementSibling;
	const dots = Array.from(dotsNav.children);
	const dotsLength = dots.length;
	const targetIndex = dots.findIndex(dot => dot === nextDot);
	moveToSlide(currentSlide, nextSlide);
	moveToDot(currentDot, nextDot);
	hideArrow(targetIndex, dotsLength);
});

// click dot, move to the corresponding slide
dotsNav.addEventListener('click', event => {
	const dots = Array.from(dotsNav.children);
	const slides = Array.from(track.children);
	const currentSlide = track.querySelector('.current-slide');
	const currentDot = dotsNav.querySelector('.current-slide');
	const targetDot = event.target.closest('button');
	if (!targetDot) {
		return;
	}
	const targetIndex = dots.findIndex(dot => dot === targetDot);
	const targetSlide = slides[targetIndex];
	moveToSlide(currentSlide, targetSlide);
	moveToDot(currentDot, targetDot);
	hideArrow(targetIndex, dots.length);
});

function arrangeSlides() {
	const slides = Array.from(track.children);
	const slideWidth = slides[0].getBoundingClientRect().width;

	// arange the slides next to one another
	const setSlidePosition = (slide, index) => {
		slide.style.left = `${slideWidth * index}px`;
	};
	slides.forEach(setSlidePosition);
}

// Get the photos of selected city from google map api
function setCityPhotoUrl() {
	// create carousel slides and assign images
	function createCarouselSlides(urlList, results) {
		urlList.forEach((item, index) => {
			track.style.transform = `translateX(0px)`;
			const li = document.createElement('li');
			const a = document.createElement('a');
			const img = document.createElement('img');
			const button = document.createElement('button');
			li.classList.add('carousel__slide');
			a.classList.add('carousel__link');
			a.target = 'blank';
			a.href = results.url;
			img.classList.add('carousel__image', 'mb-4');
			img.src = item;
			button.classList.add('carousel__indicator');
			a.appendChild(img);
			li.appendChild(a);
			track.appendChild(li);
			dotsNav.appendChild(button);
			if (index === 0) {
				li.classList.add('current-slide');
				button.classList.add('current-slide');
			}
		});
	}
	const photoUrlList = [];
	const plcaeInfo = searchBox.getPlaces();
	// if searchbox return info.
	if (plcaeInfo !== undefined) {
		const photos = plcaeInfo[0]['photos'];
		photos.forEach(photo => {
			photoUrlList.push(photo.getUrl());
		});
		createCarouselSlides(photoUrlList, searchBox.getPlaces()[0]);
		arrangeSlides();
	}
	//  when first loaded the page
	else {
		const service = new google.maps.places.PlacesService(input);
		const request = {
			placeId: 'ChIJL1cHXAbzbjQRaVScvwTwEec',
			fields: ['photos', 'url'],
		};
		service.getDetails(request, (results, status) => {
			if (status == 'OK') {
				results.photos.forEach(photo => {
					photoUrlList.push(photo.getUrl());
				});
			} else {
				console.log('error');
			}
			createCarouselSlides(photoUrlList, results);
			arrangeSlides();
		});
	}
}

// Get the information of the searched place
function getInfo() {
	const address = input.value;
	geocoder.geocode({ address: address }, (results, status) => {
		if (status == 'OK') {
			const latLng = {};
			latLng.lat = results[0].geometry.location.lat();
			latLng.lng = results[0].geometry.location.lng();
			const cityName = results[0].address_components[0].long_name;
			requestData(cityName, latLng.lat, latLng.lng);
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}

// request data from server
async function requestData(city, lat, lng) {
	try {
		const [currentWeather, threeHrsForecast, fiveDaysForecast] = await Promise.all([
			// Today's weather and 5 days forecast
			fetch(`https://jasons-weather-app.herokuapp.com/weather/current/${city}`),
			fetch(`https://jasons-weather-app.herokuapp.com/weather/forecast/3hours/${city}`),
			fetch(`https://jasons-weather-app.herokuapp.com/weather/forecast/5days/${lat}/${lng}`),
		]);

		const weather = await currentWeather.json();
		const forecast = await threeHrsForecast.json();
		const fiveDays = await fiveDaysForecast.json();
		displayData(weather, forecast, fiveDays, city);
	} catch {
		err => console.log(err);
	}
}

function displayData(weatherData, forecastData, fiveDaysData, cityName) {
	// console.log(weatherData);
	// console.log(forecastData);
	function convertUnixToTime(unixTime, format) {
		// In Taiwan timezone
		const unixTimestamp = unixTime;
		// Change to UTC timezone (8hr * 60mins * 60sec)
		const utcTime = unixTimestamp - 28800;
		// Change to local timezone
		const localTime = utcTime + weatherData.timezone;
		// Change to milliseconds
		const milliseconds = localTime * 1000;
		// Change to date format
		const dateObject = new Date(milliseconds);
		const time = dateObject.toLocaleString('en-GB', format);

		return time;
	}

	const city = document.getElementById('city');
	const icon = document.getElementById('weather-icon');
	const temp = document.getElementById('temp');
	const date = document.getElementById('current-date');
	const time = document.getElementById('current-time');
	const weather = document.getElementById('weather');
	const humidity = document.getElementById('humidity');
	const wind = document.getElementById('wind');
	const sunrise = document.getElementById('sunrise');
	const sunset = document.getElementById('sunset');
	const pressure = document.getElementById('pressure');
	const feels = document.getElementById('feels');
	const visibiity = document.getElementById('visibility');

	// data received successfully
	if (weatherData.message !== 'city not found') {
		// Fill the info on display section
		city.innerHTML = cityName;
		const iconCode = weatherData.weather[0].icon;
		icon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
		temp.innerHTML = `${parseInt(weatherData.main.temp)}°C`;
		const currentDate = convertUnixToTime(weatherData.dt, {
			month: 'long',
			day: '2-digit',
			weekday: 'long',
		});
		const currentTime = convertUnixToTime(weatherData.dt, { hour: '2-digit', minute: '2-digit' });
		date.innerHTML = currentDate;
		time.innerHTML = currentTime;
		weather.innerHTML = weatherData.weather[0].main;
		setCityPhotoUrl();

		// Switching between today and fiveDays
		const todayDiv = document.getElementById('today');
		const fiveDaysDiv = document.getElementById('five-days');
		const todayBtn = document.querySelector('#today-btn');
		const fiveDatsbtn = document.querySelector('#fiveDays-btn');
		todayBtn.addEventListener('click', () => {
			todayDiv.style.display = 'flex';
			fiveDaysDiv.style.display = 'none';
			todayBtn.classList.remove('lighter-black');
			fiveDatsbtn.classList.add('lighter-black');
			fiveDaysData;
		});
		fiveDatsbtn.addEventListener('click', () => {
			todayDiv.style.display = 'none';
			fiveDaysDiv.style.display = 'flex';
			todayBtn.classList.add('lighter-black');
			fiveDatsbtn.classList.remove('lighter-black');
		});

		// To render the info of today weather forcast (3hrs-interval)
		const timeList = document.querySelectorAll('#time-today');
		timeList.forEach((item, index) => {
			const time = new Date((forecastData.list[index].dt + weatherData.timezone) * 1000);
			item.innerHTML = `${time.toLocaleString('en-GB', {
				timeZone: 'UTC',
				hour: '2-digit',
				minute: '2-digit',
			})}`;
		});

		const forecastImgList = document.querySelectorAll('#forecast-img-today');
		forecastImgList.forEach((img, index) => {
			img.src = `https://openweathermap.org/img/wn/${forecastData.list[index].weather[0].icon}@2x.png`;
		});

		const tempMinMaxList = document.querySelectorAll('#temp-min-max-today');
		tempMinMaxList.forEach((item, index) => {
			item.innerHTML = `H: ${parseInt(forecastData.list[index].main.temp_max)} L: ${parseInt(
				forecastData.list[index].main.temp_min
			)}`;
		});

		// to render five days forecast data
		const timeListFiveDays = document.querySelectorAll('#time-five-days');
		timeListFiveDays.forEach((item, index) => {
			const weekday = new Date(
				(fiveDaysData.daily[index].dt + fiveDaysData['timezone_offset']) * 1000
			);
			item.innerHTML = `${weekday.toLocaleString('en-GB', {
				weekday: 'long',
			})}`;
		});

		const forecastImgListFiveDays = document.querySelectorAll('#forecast-img-five-days');
		forecastImgListFiveDays.forEach((img, index) => {
			img.src = `https://openweathermap.org/img/wn/${fiveDaysData.daily[index].weather[0].icon}@2x.png`;
		});

		const tempMinMaxListFiveDays = document.querySelectorAll('#temp-min-max-five-days');
		tempMinMaxListFiveDays.forEach((item, index) => {
			item.innerHTML = `H: ${parseInt(fiveDaysData.daily[index].temp.max)} L: ${parseInt(
				fiveDaysData.daily[index].temp.min
			)}`;
		});

		// To render info on the highlight section
		visibiity.innerHTML = `${weatherData.visibility}`;
		humidity.innerHTML = weatherData.main.humidity;
		wind.innerHTML = weatherData.wind.speed;
		feels.innerHTML = parseInt(weatherData.main['feels_like']);
		sunrise.innerHTML = convertUnixToTime(weatherData.sys.sunrise, {
			hour: '2-digit',
			minute: '2-digit',
		});
		sunset.innerHTML = convertUnixToTime(weatherData.sys.sunset, {
			hour: '2-digit',
			minute: '2-digit',
		});
		pressure.innerHTML = weatherData.main.pressure;
	}
	// data not found
	else {
		alert('sorry, data not avalible!');
	}
	// clear input value
	input.value = '';
}

// clear the old images and dots
function removeOldCarousel() {
	const slides = document.querySelectorAll('.carousel__slide');
	const dots = document.querySelectorAll('.carousel__indicator');
	const remove = item => {
		item.remove();
	};
	slides.forEach(remove);
	dots.forEach(remove);
}

searchBox.addListener('places_changed', () => {
	const places = searchBox.getPlaces();
	if (places.length == 0) {
		return;
	}
});

// When user press the enter key at the searchbox / click the search button, call the getInfo function
button.addEventListener('click', () => {
	{
		if (searchBox.getPlaces()) {
			removeOldCarousel();
			getInfo();
		} else {
			return;
		}
	}
});

input.addEventListener('keydown', e => {
	if (e.keyCode == 13 && searchBox.getPlaces()) {
		removeOldCarousel();
		getInfo();
	}
});
