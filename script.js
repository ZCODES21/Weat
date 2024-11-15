        const API_KEY = '84fc4d20485ed572fc6da004de06e214';
        let currentUnit = 'celsius';
        let savedLocations = JSON.parse(localStorage.getItem('savedLocations')) || [];

        function showLoading(show) {
            document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
        }

        function showError(message) {
            const errorElement = document.getElementById('errorMessage');
            errorElement.textContent = message;
            errorElement.style.display = message ? 'block' : 'none';
            errorElement.classList.add('animate__animated', 'animate__fadeIn');
            setTimeout(() => errorElement.style.display = 'none', 5000);
        }

        function showSuccess(message) {
            const successElement = document.getElementById('successMessage');
            successElement.textContent = message;
            successElement.style.display = message ? 'block' : 'none';
            successElement.classList.add('animate__animated', 'animate__fadeIn');
            setTimeout(() => successElement.style.display = 'none', 3000);
        }

        function showWeatherAlert(message) {
            const alertElement = document.getElementById('weatherAlert');
            alertElement.textContent = message;
            alertElement.style.display = message ? 'block' : 'none';
            alertElement.classList.add('animate__animated', 'animate__fadeIn');
        }

        async function getWeather() {
    const cityInput = document.getElementById('cityInput');
    const city = cityInput.value.trim();
    
    if (!city) {
        showError('Please enter a city name');
        return;
    }
    
    showLoading(true);
    try {
        const geoResponse = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${city}&limit=1&appid=${API_KEY}`
        );

        if (!geoResponse.ok) {
            throw new Error('Error fetching geo data: ' + geoResponse.statusText);
        }

        const geoData = await geoResponse.json();
        console.log('Geo Data:', geoData);

        if (!geoData.length) {
            throw new Error('City not found. Please check the spelling or try a different city.');
        }

        const { lat, lon } = geoData[0];
        
        // Current weather
        const weatherResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );

        if (!weatherResponse.ok) {
            throw new Error('Weather data not available: ' + weatherResponse.statusText);
        }
        
        const weatherData = await weatherResponse.json();
        
        // Forecast
        const forecastResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
        );

        if (!forecastResponse.ok) {
            throw new Error('Forecast data not available: ' + forecastResponse.statusText);
        }
        
        const forecastData = await forecastResponse.json();
        
        // Air quality data
        const airQualityResponse = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
        );

        if (!airQualityResponse.ok) {
            throw new Error('Air quality data not available: ' + airQualityResponse.statusText);
        }
        
        const airQualityData = await airQualityResponse.json();
        
        updateWeatherUI(weatherData, forecastData, airQualityData);
        updateBackgroundTheme(weatherData.weather[0].main);
        addToSavedLocations(city);
        
        showSuccess('Weather data updated successfully');
        
    } catch (error) {
        showError(error.message);
    } finally {
        showLoading(false);
    }
}

        
        function updateWeatherUI(weatherData, forecastData, airQualityData) {
            // Update city and date
            document.getElementById('cityName').textContent = weatherData.name;
            document.getElementById('dateTime').textContent = new Date().toLocaleString();
            
            // Update current weather
            const temp = currentUnit === 'celsius' ? weatherData.main.temp : (weatherData.main.temp * 9/5) + 32;
            document.getElementById('temperature').textContent = `${Math.round(temp)}°${currentUnit === 'celsius' ? 'C' : 'F'}`;
            document.getElementById('weatherDescription').textContent = weatherData.weather[0].description;
            document.getElementById('humidity').textContent = `${weatherData.main.humidity}%`;
            document.getElementById('windSpeed').textContent = `${(weatherData.wind.speed * 3.6).toFixed(1)} km/h`;
            document.getElementById('pressure').textContent = `${weatherData.main.pressure} hPa`;
            
            // Update weather icon
            const weatherIcon = document.getElementById('weatherIcon');
            weatherIcon.innerHTML = getWeatherIcon(weatherData.weather[0].main);
            weatherIcon.classList.add('animate__animated', 'animate__bounce');
            
            // Update forecast
            updateForecast(forecastData);
            
            // Update air quality
            updateAirQuality(airQualityData);
            
            // Check for extreme weather conditions
            checkWeatherAlerts(weatherData);
        }
        
        function updateForecast(forecastData) {
            const forecastContainer = document.getElementById('forecast');
            forecastContainer.innerHTML = '';
            
            const dailyForecasts = {};
            
            forecastData.list.forEach(forecast => {
                const date = new Date(forecast.dt * 1000).toLocaleDateString();
                if (!dailyForecasts[date]) {
                    dailyForecasts[date] = forecast;
                }
            });
            
            Object.values(dailyForecasts).slice(1, 6).forEach(forecast => {
                const date = new Date(forecast.dt * 1000);
                const temp = currentUnit === 'celsius' ? forecast.main.temp : (forecast.main.temp * 9/5) + 32;
                
                const forecastCard = document.createElement('div');
                forecastCard.className = 'forecast-card animate__animated animate__fadeIn';
                forecastCard.innerHTML = `
                    <div class="forecast-day">${date.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                    <div class="weather-icon">${getWeatherIcon(forecast.weather[0].main)}</div>
                    <div>${Math.round(temp)}°${currentUnit === 'celsius' ? 'C' : 'F'}</div>
                    <div>${forecast.weather[0].description}</div>
                `;
                forecastContainer.appendChild(forecastCard);
            });
        }
        
        function updateAirQuality(airQualityData) {
            const aqi = airQualityData.list[0].main.aqi;
            const aqiDescriptions = {
                1: 'Good',
                2: 'Fair',
                3: 'Moderate',
                4: 'Poor',
                5: 'Very Poor'
            };
            
            document.getElementById('aqiDescription').textContent = `Air Quality: ${aqiDescriptions[aqi]}`;
            updateAQIGauge(aqi);
        }
        
        function updateAQIGauge(aqi) {
            const canvas = document.createElement('canvas');
            canvas.width = 200;
            canvas.height = 100;
            const ctx = canvas.getContext('2d');
            
            // Gauge background
            ctx.beginPath();
            ctx.arc(100, 80, 60, Math.PI, 0);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 10;
            ctx.stroke();
            
            // Gauge value
            ctx.beginPath();
            ctx.arc(100, 80, 60, Math.PI, Math.PI + (aqi / 5) * Math.PI);
            ctx.strokeStyle = getAQIColor(aqi);
            ctx.stroke();
            
            const gaugeContainer = document.getElementById('aqiGauge');
            gaugeContainer.innerHTML = '';
            gaugeContainer.appendChild(canvas);
        }
        
        function getAQIColor(aqi) {
            const colors = {
                1: '#00e400',
                2: '#ffff00',
                3: '#ff7e00',
                4: '#ff0000',
                5: '#99004c'
            };
            return colors[aqi];
        }
        
        function getWeatherIcon(weatherType) {
            const icons = {
                'Clear': '<i class="fas fa-sun"></i>',
                'Clouds': '<i class="fas fa-cloud"></i>',
                'Rain': '<i class="fas fa-cloud-rain"></i>',
                'Snow': '<i class="fas fa-snowflake"></i>',
                'Thunderstorm': '<i class="fas fa-bolt"></i>',
                'Drizzle': '<i class="fas fa-cloud-rain"></i>',
                'Mist': '<i class="fas fa-smog"></i>',
                'Smoke': '<i class="fas fa-smog"></i>',
                'Haze': '<i class="fas fa-smog"></i>',
                'Dust': '<i class="fas fa-smog"></i>',
                'Fog': '<i class="fas fa-smog"></i>'
            };
            return icons[weatherType] || '<i class="fas fa-cloud"></i>';
        }
        
        function updateBackgroundTheme(weatherType) {
            const themes = {
                'Clear': 'linear-gradient(120deg, #283d89 0%, #fda085 100%)',
                'Clouds': 'linear-gradient(120deg, #192888 0%, #66a6ff 100%)',
                'Rain': 'linear-gradient(120deg, #13547a 0%, #80d0c7 100%)',
                'Snow': 'linear-gradient(120deg, #36480f 0%, #96e6a1 100%)',
                'Thunderstorm': 'linear-gradient(120deg, #09203f 0%, #537895 100%)',
                'Drizzle': 'linear-gradient(120deg, #073d41 0%, #66a6ff 100%)',
                'Mist': 'linear-gradient(120deg, #435813 0%, #96e6a1 100%)'
            };
            
            document.body.style.background = themes[weatherType] || 'linear-gradient(120deg, #a1c4fd 0%, #c2e9fb 100%)';
        }
        
        function checkWeatherAlerts(weatherData) {
            const alerts = [];
            
            if (weatherData.main.temp > 35) {
                alerts.push('Extreme heat warning! Stay hydrated and avoid prolonged sun exposure.');
            }
            if (weatherData.main.temp < 0) {
                alerts.push('Freezing conditions! Take precautions against ice and frost.');
            }
            if (weatherData.wind.speed > 20) {
                alerts.push('Strong winds! Secure loose objects and exercise caution.');
            }
            
            showWeatherAlert(alerts.join('\n'));
        }
        
        function useCurrentLocation() {
            if (navigator.geolocation) {
                showLoading(true);
                navigator.geolocation.getCurrentPosition(
                    async position => {
                        try {
                            const { latitude, longitude } = position.coords;
                            
                            const response = await fetch(
                                `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${API_KEY}`
                            );
                            
                            if (!response.ok) throw new Error('Weather data not available');
                            
                            const weatherData = await response.json();
                            document.getElementById('cityInput').value = weatherData.name;
                            getWeather();
                            
                        } catch (error) {
                            showError(error.message);
                        } finally {
                            showLoading(false);
                        }
                    },
                    error => {
                        showError('Unable to get your location');
                        showLoading(false);
                    }
                );
            } else {
                showError('Geolocation is not supported by your browser');
            }
        }
        
        function addToSavedLocations(city) {
            if (!savedLocations.includes(city)) {
                savedLocations.push(city);
                if (savedLocations.length > 5) {
                    savedLocations.shift();
                }
                localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
                updateSavedLocations();
            }
        }
        
        function updateSavedLocations() {
            const container = document.getElementById('savedLocations');
            container.innerHTML = '';
            
            savedLocations.forEach(city => {
                const element = document.createElement('div');
                element.className = 'saved-location animate__animated animate__fadeIn';
                element.innerHTML = `
                    <span onclick="searchSavedLocation('${city}')">${city}</span>
                    <i class="fas fa-times" onclick="removeLocation('${city}')"></i>
                `;
                container.appendChild(element);
            });
        }
        
        function searchSavedLocation(city) {
            document.getElementById('cityInput').value = city;
            getWeather();
        }
        
        function removeLocation(city) {
            savedLocations = savedLocations.filter(loc => loc !== city);
            localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
            updateSavedLocations();
        }
        
        // Temperature unit toggle
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const unit = btn.dataset.unit;
                if (unit !== currentUnit) {
                    currentUnit = unit;
                    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    if (document.getElementById('temperature').textContent !== '--°') {
                        getWeather();
                    }
                }
            });
        });
        
        document.addEventListener('DOMContentLoaded', () => {
            updateSavedLocations();
            
            // key support
            document.getElementById('cityInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    getWeather();
                }
            });
        });
