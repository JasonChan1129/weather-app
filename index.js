const BASE_URL = 'https://weather-app-server-63a8e5342c48.herokuapp.com/';

// Create a google map search box element
function createSearchBox() {
	const input = document.querySelector('input');
	const searchBox = new google.maps.places.SearchBox(input);
	return searchBox;
}

function newGeocoder() {
	return new google.maps.Geocoder();
}

async function fetchAndDisplayWeatherData(city, lat, lng) {
	try {
		const [currentWeather, threeHrsForecast, fiveDaysForecast] = await Promise.all([
			// Today's weather and 5 days forecast
			fetch(`${BASE_URL}weather/current/${city}`),
			fetch(`${BASE_URL}weather/forecast/3hours/${city}`),
			fetch(`${BASE_URL}weather/forecast/5days/${lat}/${lng}`),
		]);

		const weather = await currentWeather.json();
		const forecast = await threeHrsForecast.json();
		const fiveDays = await fiveDaysForecast.json();
		displayData(weather, forecast, fiveDays, city);
	} catch {
		err => console.log(err);
	}
}

// display the given data
function displayData(weatherData, forecastData, fiveDaysData, cityName) {
	const city = document.querySelector('#city');
	const icon = document.querySelector('#weather-icon');
	const temp = document.querySelector('#temp');
	const date = document.querySelector('#current-date');
	const time = document.querySelector('#current-time');
	const weather = document.querySelector('#weather');
	const humidity = document.querySelector('#humidity');
	const wind = document.querySelector('#wind');
	const sunrise = document.querySelector('#sunrise');
	const sunset = document.querySelector('#sunset');
	const pressure = document.querySelector('#pressure');
	const feels = document.querySelector('#feels');
	const visibiity = document.querySelector('#visibility');
	const infoSection = document.querySelector('.info-section');
	const todayDiv = document.querySelector('#today');
	const fiveDaysDiv = document.querySelector('#five-days');
	const todayBtn = document.querySelector('#today-btn');
	const fiveDatsbtn = document.querySelector('#fiveDays-btn');

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
		infoSection.addEventListener('click', event => {
			const target = event.target;
			if (target.id === 'today-btn') {
				todayDiv.classList.remove('is-hidden');
				todayBtn.classList.remove('lighter-black');
				fiveDaysDiv.classList.add('is-hidden');
				fiveDatsbtn.classList.add('lighter-black');
			} else if (target.id === 'fiveDays-btn') {
				todayDiv.classList.add('is-hidden');
				todayBtn.classList.add('lighter-black');
				fiveDaysDiv.classList.remove('is-hidden');
				fiveDatsbtn.classList.remove('lighter-black');
			}
		});

		// To render the info. of today weather forcast (3hrs-interval)
		const todayCards = Array.from(todayDiv.children);
		todayCards.forEach((card, index) => {
			const timeDiv = card.children[0];
			const iconImg = card.children[1];
			const tempDiv = card.children[2];
			const time = new Date((forecastData.list[index].dt + weatherData.timezone) * 1000);
			timeDiv.innerText = `${time.toLocaleString('en-GB', {
				timeZone: 'UTC',
				hour: '2-digit',
				minute: '2-digit',
			})}`;
			iconImg.src = `https://openweathermap.org/img/wn/${forecastData.list[index].weather[0].icon}@2x.png`;
			tempDiv.innerText = `H: ${parseInt(forecastData.list[index].main.temp_max)} L: ${parseInt(
				forecastData.list[index].main.temp_min
			)}`;
		});
		// To render the info. of this week weather forcast (next four days(includes today))
		const fiveDaysCards = Array.from(fiveDaysDiv.children);
		fiveDaysCards.forEach((card, index) => {
			const timeDiv = card.children[0];
			const iconImg = card.children[1];
			const tempDiv = card.children[2];
			const weekday = new Date(
				(fiveDaysData.daily[index].dt + fiveDaysData['timezone_offset']) * 1000
			);
			timeDiv.innerText = `${weekday.toLocaleString('en-GB', {
				weekday: 'long',
			})}`;
			iconImg.src = `https://openweathermap.org/img/wn/${fiveDaysData.daily[index].weather[0].icon}@2x.png`;
			tempDiv.innerText = `H: ${parseInt(fiveDaysData.daily[index].temp.max)} L: ${parseInt(
				fiveDaysData.daily[index].temp.min
			)}`;
		});

		// To render info. on the highlight section
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

// Main function to initialize the application
function initWeatherApp() {
	const searchBox = createSearchBox();
	const geocoder = newGeocoder();

	// Default weather info for Taiwan
	fetchAndDisplayWeatherData('Taiwan', 23.69781, 120.960515);

	searchBox.addListener('places_changed', () => {
		const places = searchBox.getPlaces();
		if (places.length === 0) {
			return;
		}
	});

	const searchButton = document.querySelector('.search-box button');
	searchButton.addEventListener('click', () => {
		if (searchBox.getPlaces()) {
			removeOldCarousel();
			getInfo(searchBox, geocoder);
		} else {
			return;
		}
	});

	const input = document.querySelector('input');
	input.addEventListener('keydown', e => {
		if (e.keyCode === 13 && searchBox.getPlaces()) {
			removeOldCarousel();
			getInfo(searchBox, geocoder);
		}
	});
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
			fetchAndDisplayWeatherData(cityName, latLng.lat, latLng.lng);
		} else {
			alert('Geocode was not successful for the following reason: ' + status);
		}
	});
}

// Get the photos of selected city from google map api
function setCityPhotoUrl() {
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

// FOR CAROUSELL EFFECT
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

initWeatherApp();
