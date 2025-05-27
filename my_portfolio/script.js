document.addEventListener('DOMContentLoaded', () => {
    const achievementDisplay = document.getElementById('achievement-display');
    const achievementTitleElem = document.getElementById('achievement-title');
    const achievementDescriptionElem = document.getElementById('achievement-description');
    const closeAchievementBtn = document.getElementById('close-achievement');
    const gameCanvasContainer = document.getElementById('game-canvas-container');
    const controlsInfoPanel = document.getElementById('controls-info');

    const achievements = { /* ... (achievements data remains the same) ... */
        "achievement1": { title: "Project Alpha Completed", description: "Successfully launched Project Alpha, exceeding all initial targets." },
        "achievement2": { title: "Innovation Award 2023", description: "Received the company's annual Innovation Award for developing a groundbreaking new feature." },
        "achievement3": { title: "Led a Successful Team", description: "Mentored and led a team of 5 to deliver a critical project on time and under budget." },
        "achievement4": { title: "Published Research Paper", description: "Co-authored and published a research paper in a renowned industry journal." },
        "achievement5": { title: "Client Acclaim", description: "Received outstanding feedback from a major client for exceptional problem-solving skills." },
        "achievement6": { title: "Community Contribution", description: "Volunteered expertise to a local non-profit, helping them streamline their tech operations." },
        "achievement7": { title: "Certified Cloud Architect", description: "Achieved professional certification as a Cloud Solutions Architect, demonstrating expertise in cloud infrastructure." },
        "achievement8": { title: "Open Source Contributor", description: "Made significant contributions to a popular open-source project, enhancing its functionality." },
        "achievement9": { title: "Speaker at Tech Conference", description: "Presented a talk on emerging technologies at a national tech conference." },
        "achievement10": { title: "Patent for Novel Algorithm", description: "Awarded a patent for inventing a novel algorithm that improves data processing efficiency." },
        "achievement11": { title: "Process Optimization Expert", description: "Redesigned a key business process, resulting in a 30% reduction in operational costs." }
    };
    const allMilestonesData = [ /* ... (milestones data remains the same) ... */
        { id: "m1", position: new THREE.Vector3(50, 0, 0), achievementId: "achievement1", reached: false },
        { id: "m2", position: new THREE.Vector3(100, 0, 20), achievementId: "achievement2", reached: false },
        { id: "m3", position: new THREE.Vector3(150, 0, -10), achievementId: "achievement10", reached: false },
        { id: "m4", position: new THREE.Vector3(0, 0, 50), achievementId: "achievement3", reached: false },
        { id: "m5", position: new THREE.Vector3(-30, 0, 100), achievementId: "achievement5", reached: false },
        { id: "m6", position: new THREE.Vector3(20, 0, 150), achievementId: "achievement11", reached: false },
        { id: "m7", position: new THREE.Vector3(-50, 0, -50), achievementId: "achievement7", reached: false },
        { id: "m8", position: new THREE.Vector3(-100, 0, 0), achievementId: "achievement8", reached: false },
        { id: "m9", position: new THREE.Vector3(-150, 0, 50), achievementId: "achievement9", reached: false },
        { id: "m10", position: new THREE.Vector3(-100, 0, 100), achievementId: "achievement4", reached: false },
        { id: "m11", position: new THREE.Vector3(70, 0, -60), achievementId: "achievement6", reached: false },
    ];
    let milestoneObjects = [];
    let gameActive = false;
    let scene, camera, renderer, carGroup, wheels = [], frontWheels = [];
    const clock = new THREE.Clock();

    // Enhanced car physics
    let carVelocity = 0;
    let carAngularVelocity = 0;
    const maxSpeed = 25;
    const acceleration = 35;
    const deceleration = 20;
    const turnSpeed = 6.0; // Further increased for unrestricted rotation
    const maxTurnSpeed = 8.0; // Further increased maximum turn speed

    const keysPressed = {};
    const wheelRadius = 0.5;
    const initialCarPosition = new THREE.Vector3(0, wheelRadius, 0);
    const initialCarLookAt = new THREE.Vector3(0, wheelRadius, -1);

    // Visual enhancement variables
    let dustParticles = [];
    let carBody, carWindows, carLights;

    // Infinite Terrain System
    const CHUNK_SIZE = 100; // Size of each terrain chunk
    const RENDER_DISTANCE = 3; // Number of chunks to render in each direction
    const terrainChunks = new Map(); // Store active terrain chunks
    let terrainMaterial; // Shared material for all chunks

    // Enhanced Racing Camera System
    let currentCameraMode = 'chase'; // 'chase', 'hood', 'far'
    let cameraTarget = new THREE.Vector3();
    let cameraVelocity = new THREE.Vector3();

    // Procedural Achievement System
    let proceduralAchievements = [];
    const ACHIEVEMENT_DENSITY = 0.3; // Achievements per chunk

    function initThreeJS() {
        console.log("initThreeJS called");
        if (!gameCanvasContainer) {
            console.error("gameCanvasContainer not found!");
            return;
        }
        console.log("gameCanvasContainer dimensions:", gameCanvasContainer.clientWidth, gameCanvasContainer.clientHeight);

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x70c5ce); // Sky blue (restored)

        let aspect = gameCanvasContainer.clientWidth / gameCanvasContainer.clientHeight;
        if (!isFinite(aspect) || aspect <= 0) {
            console.warn("Calculated aspect ratio is invalid, falling back to window aspect. Container dimensions:", gameCanvasContainer.clientWidth, gameCanvasContainer.clientHeight);
            aspect = window.innerWidth / window.innerHeight;
            if (!isFinite(aspect) || aspect <= 0) { // Fallback if window dimensions are also zero
                aspect = 16/9;
                console.warn("Window aspect also invalid, defaulting to 16/9");
            }
        }
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        // Camera will be positioned by the racing camera system after car is created
        console.log("Camera initialized");

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(gameCanvasContainer.clientWidth, gameCanvasContainer.clientHeight);
        renderer.shadowMap.enabled = true; // Restore shadow map
        gameCanvasContainer.appendChild(renderer.domElement);
        console.log("Renderer initialized and appended");

        // Initialize Infinite Terrain System
        initInfiniteTerrain();
        console.log("Infinite terrain system initialized - truly endless driving!");

        // Restore car creation
        createCar();
        console.log("createCar called");

        // Initialize camera position to follow the car
        if (carGroup) {
            updateRacingCamera(0.016); // Initialize with 60fps delta time
        }


        // Milestones still commented out for now
        setupAllMilestoneObjects(); // Re-enable milestone creation
        console.log("setupAllMilestoneObjects called");

        // Restore full lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Restored intensity
        scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9); // Restored intensity
        directionalLight.position.set(15, 25, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        scene.add(directionalLight);
        console.log("Full lighting restored");


        window.addEventListener('resize', onWindowResize, false);
        startGame(); // Restore starting the game logic
        animate();
        console.log("initThreeJS finished, animation loop started");
    }

    function createCar() {
        carGroup = new THREE.Group();
        carGroup.position.copy(initialCarPosition);
        carGroup.lookAt(initialCarLookAt);

        // Enhanced car body with better proportions
        const bodyGeometry = new THREE.BoxGeometry(2.2, 1.2, 4.5);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a4c96,
            metalness: 0.8,
            roughness: 0.2
        });
        carBody = new THREE.Mesh(bodyGeometry, bodyMaterial);
        carBody.castShadow = true;
        carBody.position.y = 0.6;
        carGroup.add(carBody);

        // Car roof
        const roofGeometry = new THREE.BoxGeometry(1.8, 0.8, 2.5);
        const roofMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f2d5c,
            metalness: 0.9,
            roughness: 0.1
        });
        const carRoof = new THREE.Mesh(roofGeometry, roofMaterial);
        carRoof.castShadow = true;
        carRoof.position.set(0, 1.5, -0.3);
        carGroup.add(carRoof);

        // Windows
        const windowGeometry = new THREE.BoxGeometry(1.7, 0.7, 2.3);
        const windowMaterial = new THREE.MeshStandardMaterial({
            color: 0x87ceeb,
            transparent: true,
            opacity: 0.3,
            metalness: 0.1,
            roughness: 0.1
        });
        carWindows = new THREE.Mesh(windowGeometry, windowMaterial);
        carWindows.position.set(0, 1.5, -0.3);
        carGroup.add(carWindows);

        // Headlights
        const headlightGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const headlightMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0xffffaa,
            emissiveIntensity: 0.3
        });
        const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        leftHeadlight.position.set(-0.7, 0.8, 2.3);
        carGroup.add(leftHeadlight);

        const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
        rightHeadlight.position.set(0.7, 0.8, 2.3);
        carGroup.add(rightHeadlight);

        // Enhanced wheels with rims
        const wheelGeometry = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.4, 32);
        const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });

        const rimGeometry = new THREE.CylinderGeometry(wheelRadius * 0.7, wheelRadius * 0.7, 0.45, 32);
        const rimMaterial = new THREE.MeshStandardMaterial({
            color: 0xc0c0c0,
            metalness: 0.9,
            roughness: 0.1
        });

        const wheelPositions = [
            new THREE.Vector3(1.2, 0, 1.8), new THREE.Vector3(-1.2, 0, 1.8),
            new THREE.Vector3(1.2, 0, -1.8), new THREE.Vector3(-1.2, 0, -1.8)
        ];

        wheels = [];
        frontWheels = [];

        for (let i = 0; i < 4; i++) {
            const wheelGroup = new THREE.Group();

            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.castShadow = true;
            wheel.rotation.z = Math.PI / 2;
            wheelGroup.add(wheel);

            const rim = new THREE.Mesh(rimGeometry, rimMaterial);
            rim.castShadow = true;
            rim.rotation.z = Math.PI / 2;
            wheelGroup.add(rim);

            wheelGroup.position.copy(wheelPositions[i]);
            wheelGroup.position.y = wheelRadius;
            carGroup.add(wheelGroup);
            wheels.push(wheelGroup);

            // Front wheels for steering
            if (i < 2) {
                frontWheels.push(wheelGroup);
            }
        }

        // Add some car details
        const bumperGeometry = new THREE.BoxGeometry(2.4, 0.3, 0.3);
        const bumperMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const frontBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        frontBumper.position.set(0, 0.3, 2.4);
        carGroup.add(frontBumper);

        const rearBumper = new THREE.Mesh(bumperGeometry, bumperMaterial);
        rearBumper.position.set(0, 0.3, -2.4);
        carGroup.add(rearBumper);

        scene.add(carGroup);
    }

    // Infinite Terrain System Implementation
    function initInfiniteTerrain() {
        // Create shared terrain material for performance
        terrainMaterial = new THREE.MeshStandardMaterial({
            color: 0x4a5d23,
            roughness: 0.8,
            metalness: 0.1
        });

        // Generate initial terrain chunks around the car
        updateTerrainChunks(0, 0);
    }

    function getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    function getChunkCoordinates(worldX, worldZ) {
        return {
            x: Math.floor(worldX / CHUNK_SIZE),
            z: Math.floor(worldZ / CHUNK_SIZE)
        };
    }

    function createTerrainChunk(chunkX, chunkZ) {
        const chunkKey = getChunkKey(chunkX, chunkZ);

        // Don't create if already exists
        if (terrainChunks.has(chunkKey)) {
            return terrainChunks.get(chunkKey);
        }

        // Create chunk geometry
        const chunkGeometry = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE, 1, 1);
        const chunkMesh = new THREE.Mesh(chunkGeometry, terrainMaterial);

        // Position the chunk
        chunkMesh.rotation.x = -Math.PI / 2;
        chunkMesh.position.set(
            chunkX * CHUNK_SIZE,
            0,
            chunkZ * CHUNK_SIZE
        );
        chunkMesh.receiveShadow = true;

        // Add to scene and store
        scene.add(chunkMesh);

        const chunkData = {
            mesh: chunkMesh,
            x: chunkX,
            z: chunkZ,
            achievements: []
        };

        terrainChunks.set(chunkKey, chunkData);

        // Generate procedural achievements for this chunk
        generateChunkAchievements(chunkData);

        return chunkData;
    }

    function removeTerrainChunk(chunkX, chunkZ) {
        const chunkKey = getChunkKey(chunkX, chunkZ);
        const chunkData = terrainChunks.get(chunkKey);

        if (chunkData) {
            // Remove chunk mesh from scene
            scene.remove(chunkData.mesh);

            // Dispose geometry and material to prevent memory leaks
            chunkData.mesh.geometry.dispose();

            // Remove achievements from this chunk
            chunkData.achievements.forEach(achievement => {
                if (achievement.object) {
                    scene.remove(achievement.object);
                    achievement.object.geometry.dispose();
                    achievement.object.material.dispose();
                }
            });

            // Remove from chunks map
            terrainChunks.delete(chunkKey);
        }
    }

    function updateTerrainChunks(carX, carZ) {
        const carChunk = getChunkCoordinates(carX, carZ);

        // Generate chunks around the car
        const chunksToKeep = new Set();

        for (let x = carChunk.x - RENDER_DISTANCE; x <= carChunk.x + RENDER_DISTANCE; x++) {
            for (let z = carChunk.z - RENDER_DISTANCE; z <= carChunk.z + RENDER_DISTANCE; z++) {
                const chunkKey = getChunkKey(x, z);
                chunksToKeep.add(chunkKey);

                // Create chunk if it doesn't exist
                if (!terrainChunks.has(chunkKey)) {
                    createTerrainChunk(x, z);
                }
            }
        }

        // Remove distant chunks
        for (const [chunkKey, chunkData] of terrainChunks) {
            if (!chunksToKeep.has(chunkKey)) {
                removeTerrainChunk(chunkData.x, chunkData.z);
            }
        }
    }

    function generateChunkAchievements(chunkData) {
        // Generate random achievements for this chunk
        const numAchievements = Math.random() < ACHIEVEMENT_DENSITY ? 1 : 0;

        for (let i = 0; i < numAchievements; i++) {
            // Random position within chunk
            const localX = (Math.random() - 0.5) * CHUNK_SIZE * 0.8;
            const localZ = (Math.random() - 0.5) * CHUNK_SIZE * 0.8;

            const worldX = chunkData.x * CHUNK_SIZE + localX;
            const worldZ = chunkData.z * CHUNK_SIZE + localZ;

            // Create achievement object
            const achievementGeometry = new THREE.CylinderGeometry(1.2, 1.2, 5, 16);
            const achievementMaterial = new THREE.MeshPhongMaterial({
                color: 0xffd700,
                emissive: 0x443300
            });
            const achievementMesh = new THREE.Mesh(achievementGeometry, achievementMaterial);

            achievementMesh.position.set(worldX, 2.5, worldZ);
            achievementMesh.castShadow = true;
            scene.add(achievementMesh);

            // Create achievement data
            const achievement = {
                id: `proc_${chunkData.x}_${chunkData.z}_${i}`,
                position: new THREE.Vector3(worldX, 0, worldZ),
                object: achievementMesh,
                reached: false,
                title: `Discovery ${Math.abs(chunkData.x) + Math.abs(chunkData.z)}`,
                description: `Found at coordinates (${Math.round(worldX)}, ${Math.round(worldZ)})`
            };

            chunkData.achievements.push(achievement);
            proceduralAchievements.push(achievement);
        }
    }

    function onWindowResize() { /* ... (function remains the same) ... */
        if (!renderer || !camera || !gameCanvasContainer) return;
        const newWidth = gameCanvasContainer.clientWidth;
        const newHeight = gameCanvasContainer.clientHeight;

        let aspect = newWidth / newHeight;
        if (!isFinite(aspect) || aspect <= 0) {
            console.warn("Calculated aspect ratio during resize is invalid, falling back to window aspect. Container dimensions:", newWidth, newHeight);
            aspect = window.innerWidth / window.innerHeight;
             if (!isFinite(aspect) || aspect <= 0) {
                aspect = 16/9;
                console.warn("Window aspect also invalid during resize, defaulting to 16/9");
            }
        }
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
        renderer.setSize(newWidth, newHeight);
    }

    function setupAllMilestoneObjects() { /* ... (function remains the same but is not called initially) ... */
        milestoneObjects.forEach(obj => scene.remove(obj));
        milestoneObjects = [];
        allMilestonesData.forEach(milestoneData => {
            if (!milestoneData.reached) {
                const milestoneGeometry = new THREE.CylinderGeometry(1.2, 1.2, 5, 16);
                const milestoneMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700, emissive: 0x443300 });
                const milestoneMesh = new THREE.Mesh(milestoneGeometry, milestoneMaterial);
                milestoneMesh.position.copy(milestoneData.position);
                milestoneMesh.position.y = 2.5;
                milestoneMesh.castShadow = true;
                scene.add(milestoneMesh);
                milestoneObjects.push(milestoneMesh);
                milestoneData.object = milestoneMesh;
            }
        });
    }

    function showAchievement(achievementId) { /* ... (function remains the same) ... */
        gameActive = false;
        const achievement = achievements[achievementId];
        if (achievement) {
            achievementTitleElem.textContent = achievement.title;
            achievementDescriptionElem.textContent = achievement.description;
            achievementDisplay.classList.remove('hidden');
        }
    }
    function hideAchievement() { /* ... (function remains the same) ... */
        achievementDisplay.classList.add('hidden');
        gameActive = true;
    }
    function startGame() { /* ... (function remains the same but is not called initially for full game logic) ... */
        gameActive = true;
        const pTag = controlsInfoPanel ? controlsInfoPanel.querySelector('p') : null;
        if (pTag) {
             pTag.textContent = "Driving... Use W/S (Forward/Backward), A/D (Turn Left/Right) or Arrow Keys.";
        } else if (controlsInfoPanel) {
            console.warn("Could not find 'p' tag within #controls-info to update text. Check HTML structure.");
        } else {
            console.warn("#controls-info panel not found. Check HTML ID.");
        }
        console.log("Game active - Free Roam!");
    }

    function updateCar(deltaTime) {
        if (!gameActive || !carGroup || wheels.length === 0) return;

        // Enhanced physics-based movement
        let targetVelocity = 0;
        let targetAngularVelocity = 0;
        let isMoving = false;

        // Forward/Backward movement with acceleration
        if (keysPressed['w'] || keysPressed['arrowup']) {
            targetVelocity = maxSpeed;
            isMoving = true;
        } else if (keysPressed['s'] || keysPressed['arrowdown']) {
            targetVelocity = -maxSpeed * 0.7; // Reverse is slower
            isMoving = true;
        }

        // Smooth acceleration/deceleration
        if (isMoving) {
            carVelocity += (targetVelocity - carVelocity) * acceleration * deltaTime;
        } else {
            carVelocity *= Math.pow(0.1, deltaTime); // Smooth deceleration
        }

        // FIXED: Full 360-degree rotation - no velocity restrictions
        if (keysPressed['a'] || keysPressed['arrowleft']) {
            // Turn left - full speed rotation always available
            targetAngularVelocity = turnSpeed;
        } else if (keysPressed['d'] || keysPressed['arrowright']) {
            // Turn right - full speed rotation always available
            targetAngularVelocity = -turnSpeed;
        }

        // Smooth angular velocity with minimal damping for unrestricted rotation
        carAngularVelocity += (targetAngularVelocity - carAngularVelocity) * 12 * deltaTime;
        carAngularVelocity *= Math.pow(0.9, deltaTime); // Minimal damping for unrestricted rotation

        // Apply movement - no threshold restrictions for full map coverage
        carGroup.translateZ(-carVelocity * deltaTime);

        // Apply rotation without threshold - allow all rotation values
        carGroup.rotateY(carAngularVelocity * deltaTime);

        // Wheel animations
        const wheelRotationSpeed = carVelocity / wheelRadius;
        wheels.forEach((wheelGroup, index) => {
            // Rotate wheels based on movement
            wheelGroup.children.forEach(wheelPart => {
                if (wheelPart.geometry.type === 'CylinderGeometry') {
                    wheelPart.rotateX(-wheelRotationSpeed * deltaTime);
                }
            });

            // Front wheel steering animation
            if (index < 2) { // Front wheels
                const steerAngle = carAngularVelocity * 0.3;
                wheelGroup.rotation.y = THREE.MathUtils.lerp(wheelGroup.rotation.y, steerAngle, 5 * deltaTime);
            }
        });

        // Keep car firmly on the ground - no suspension bounce that could cause issues
        carGroup.position.y = wheelRadius;

        // CRITICAL FIX: Constrain rotation to Y-axis only (horizontal turning)
        // Remove all pitch (X) and roll (Z) rotations to keep car on ground plane
        carGroup.rotation.x = 0;
        carGroup.rotation.z = 0;
        // Only Y-axis rotation (yaw) is allowed for realistic ground-based turning

        // Enhanced Racing Camera System
        updateRacingCamera(deltaTime);

        // Add particle effects when moving fast
        if (Math.abs(carVelocity) > maxSpeed * 0.5) {
            createDustParticles();
        }

        // Update infinite terrain based on car position
        updateTerrainChunks(carGroup.position.x, carGroup.position.z);

        // Update HUD displays
        updateSpeedometer();
        updatePositionIndicator();

        // Check collisions with both original and procedural achievements
        checkMilestonesCollision();
        checkProceduralAchievements();
    }

    function createDustParticles() {
        // Create dust particles behind the car when moving fast
        if (dustParticles.length > 50) return; // Limit particle count

        const particleGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const particleMaterial = new THREE.MeshBasicMaterial({
            color: 0x8B4513,
            transparent: true,
            opacity: 0.6
        });

        const particle = new THREE.Mesh(particleGeometry, particleMaterial);

        // Position behind the car with some randomness
        const carPosition = carGroup.position.clone();
        const carDirection = new THREE.Vector3(0, 0, 1).applyQuaternion(carGroup.quaternion);
        const particlePosition = carPosition.clone().add(carDirection.multiplyScalar(3));
        particlePosition.x += (Math.random() - 0.5) * 2;
        particlePosition.z += (Math.random() - 0.5) * 2;
        particlePosition.y = 0.2;

        particle.position.copy(particlePosition);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                Math.random() * 2,
                (Math.random() - 0.5) * 2
            ),
            life: 1.0
        };

        scene.add(particle);
        dustParticles.push(particle);
    }

    function updateDustParticles(deltaTime) {
        for (let i = dustParticles.length - 1; i >= 0; i--) {
            const particle = dustParticles[i];

            // Update particle position
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(deltaTime));
            particle.userData.velocity.y -= 9.8 * deltaTime; // Gravity

            // Update particle life
            particle.userData.life -= deltaTime * 2;
            particle.material.opacity = particle.userData.life * 0.6;

            // Remove dead particles
            if (particle.userData.life <= 0 || particle.position.y < 0) {
                scene.remove(particle);
                dustParticles.splice(i, 1);
            }
        }
    }

    function updateSpeedometer() {
        const speedElement = document.getElementById('speed-value');
        if (speedElement) {
            // Convert velocity to km/h (approximate)
            const speedKmh = Math.abs(carVelocity) * 3.6;
            speedElement.textContent = Math.round(speedKmh);

            // Change color based on speed
            if (speedKmh > 60) {
                speedElement.style.color = '#e74c3c'; // Red for high speed
            } else if (speedKmh > 30) {
                speedElement.style.color = '#f39c12'; // Orange for medium speed
            } else {
                speedElement.style.color = '#3498db'; // Blue for low speed
            }
        }
    }

    function updatePositionIndicator() {
        const posXElement = document.getElementById('position-x');
        const posZElement = document.getElementById('position-z');

        if (posXElement && posZElement && carGroup) {
            const x = Math.round(carGroup.position.x);
            const z = Math.round(carGroup.position.z);

            posXElement.textContent = `X: ${x}`;
            posZElement.textContent = `Z: ${z}`;

            // Change color based on distance from origin (infinite terrain)
            const distance = Math.sqrt(x * x + z * z);

            if (distance > 1000) {
                posXElement.style.color = '#e74c3c'; // Red for very far
                posZElement.style.color = '#e74c3c';
            } else if (distance > 500) {
                posXElement.style.color = '#f39c12'; // Orange for far
                posZElement.style.color = '#f39c12';
            } else {
                posXElement.style.color = '#27ae60'; // Green for near origin
                posZElement.style.color = '#27ae60';
            }
        }
    }

    // Fixed Racing Camera System - Always follows the car
    function updateRacingCamera(deltaTime) {
        if (!carGroup) {
            console.warn("updateRacingCamera called but carGroup is null");
            return;
        }

        const speed = Math.abs(carVelocity);
        const speedRatio = speed / maxSpeed;

        // Speed-responsive camera settings
        let cameraDistance, cameraHeight, cameraSpeed;

        switch (currentCameraMode) {
            case 'chase':
                cameraDistance = 15 + speedRatio * 5; // 15-20 based on speed
                cameraHeight = 8 + speedRatio * 2; // 8-10 based on speed
                cameraSpeed = 0.1 + speedRatio * 0.05; // Faster following at high speed
                break;
            case 'hood':
                cameraDistance = 2; // Close behind car
                cameraHeight = 3;
                cameraSpeed = 0.2;
                break;
            case 'far':
                cameraDistance = 30 + speedRatio * 10; // 30-40 based on speed
                cameraHeight = 20 + speedRatio * 5; // 20-25 based on speed
                cameraSpeed = 0.08;
                break;
        }

        // Calculate camera position behind the car
        const carRotationY = carGroup.rotation.y;

        // Position camera behind the car using simple trigonometry
        const cameraOffsetX = Math.sin(carRotationY) * cameraDistance;
        const cameraOffsetZ = Math.cos(carRotationY) * cameraDistance;

        // Target camera position
        const targetCameraPosition = new THREE.Vector3(
            carGroup.position.x + cameraOffsetX,
            carGroup.position.y + cameraHeight,
            carGroup.position.z + cameraOffsetZ
        );

        // Smooth camera movement - always follows the car
        camera.position.lerp(targetCameraPosition, cameraSpeed);

        // Always look at the car with slight height offset
        const lookAtTarget = carGroup.position.clone();
        lookAtTarget.y += 2; // Look slightly above the car

        // Simple direct look-at - no complex calculations
        camera.lookAt(lookAtTarget);
    }

    // Procedural Achievement Collision Detection
    function checkProceduralAchievements() {
        if (!gameActive || !carGroup) return;

        proceduralAchievements.forEach(achievement => {
            if (!achievement.reached && achievement.object &&
                carGroup.position.distanceTo(achievement.position) < 6) {

                achievement.reached = true;
                showProceduralAchievement(achievement);

                // Remove achievement object
                scene.remove(achievement.object);
                achievement.object.geometry.dispose();
                achievement.object.material.dispose();
                achievement.object = null;
            }
        });
    }

    function showProceduralAchievement(achievement) {
        gameActive = false;
        achievementTitleElem.textContent = achievement.title;
        achievementDescriptionElem.textContent = achievement.description;
        achievementDisplay.classList.remove('hidden');
    }

    function checkMilestonesCollision() {
        if (!gameActive) return;
        allMilestonesData.forEach(milestoneData => {
            // Ensure carGroup and milestoneData.object exist before checking distance
            if (!milestoneData.reached && milestoneData.object && carGroup && carGroup.position.distanceTo(milestoneData.position) < 6) {
                milestoneData.reached = true;
                showAchievement(milestoneData.achievementId);
                scene.remove(milestoneData.object);
                const index = milestoneObjects.indexOf(milestoneData.object);
                if (index > -1) milestoneObjects.splice(index, 1);
                delete milestoneData.object;
            }
        });
    }

    closeAchievementBtn.addEventListener('click', hideAchievement);
    document.addEventListener('keydown', (event) => {
        keysPressed[event.key.toLowerCase()] = true;

        // Camera mode switching
        if (event.key.toLowerCase() === 'c') {
            switchCameraMode();
            event.preventDefault();
        }

        // Prevent default for game keys to avoid page scroll
        if (gameActive && ['w', 'a', 's', 'd', 'c', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(event.key.toLowerCase())) {
            event.preventDefault();
        }
    });

    function switchCameraMode() {
        const modes = ['chase', 'hood', 'far'];
        const currentIndex = modes.indexOf(currentCameraMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        currentCameraMode = modes[nextIndex];

        // Update HUD
        const cameraModeElement = document.getElementById('camera-mode');
        if (cameraModeElement) {
            cameraModeElement.textContent = currentCameraMode;
        }

        console.log(`Camera mode switched to: ${currentCameraMode}`);
    }
    document.addEventListener('keyup', (event) => {
        keysPressed[event.key.toLowerCase()] = false;
    });

    function animate() {
        requestAnimationFrame(animate);
        const deltaTime = clock.getDelta();

        updateCar(deltaTime);
        updateDustParticles(deltaTime);

        // Add some dynamic lighting effects
        if (carGroup && scene.children.length > 0) {
            const directionalLight = scene.children.find(child => child.type === 'DirectionalLight');
            if (directionalLight) {
                // Slightly move the light to create dynamic shadows
                directionalLight.position.x = 15 + Math.sin(Date.now() * 0.001) * 5;
                directionalLight.position.z = 10 + Math.cos(Date.now() * 0.001) * 5;
            }
        }

        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        } else {
            console.error("Renderer, scene or camera is missing in animate loop");
        }
    }

    initThreeJS();
});
