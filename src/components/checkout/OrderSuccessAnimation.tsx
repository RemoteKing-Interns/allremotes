"use client";

import { useEffect, useState } from "react";

interface OrderSuccessAnimationProps {
  orderId?: string;
  onComplete?: () => void;
}

export default function OrderSuccessAnimation({ orderId, onComplete }: OrderSuccessAnimationProps) {
  const [stage, setStage] = useState<"preparing" | "loading" | "delivering" | "complete">("preparing");

  useEffect(() => {
    const timer1 = setTimeout(() => setStage("loading"), 500);
    const timer2 = setTimeout(() => setStage("delivering"), 2000);
    const timer3 = setTimeout(() => {
      setStage("complete");
      onComplete?.();
    }, 4500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [onComplete]);

  return (
    <div className="order-success-animation">
      <div className="animation-container">
        {/* Background scene */}
        <div className="scene">
          {/* Sun */}
          <div className={`sun ${stage !== "preparing" ? "animate" : ""}`} />
          
          {/* Clouds */}
          <div className={`cloud cloud-1 ${stage !== "preparing" ? "animate" : ""}`} />
          <div className={`cloud cloud-2 ${stage !== "preparing" ? "animate" : ""}`} />
          
          {/* Road */}
          <div className="road">
            <div className={`road-lines ${stage === "delivering" ? "animate" : ""}`} />
          </div>
          
          {/* Truck */}
          <div className={`truck-container ${stage === "delivering" ? "animate" : stage === "complete" ? "delivered" : ""}`}>
            <div className="truck">
              {/* Truck body */}
              <div className="truck-body">
                {/* Cab */}
                <div className="cab">
                  <div className="cab-window" />
                  <div className="cab-door" />
                </div>
                {/* Trailer */}
                <div className="trailer">
                  <div className="trailer-side">
                    <span className="logo">AllRemotes</span>
                  </div>
                </div>
              </div>
              
              {/* Wheels */}
              <div className="wheel wheel-front" />
              <div className="wheel wheel-back-1" />
              <div className="wheel wheel-back-2" />
              
              {/* Smoke/exhaust */}
              <div className={`smoke ${stage === "delivering" ? "animate" : ""}`}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
          
          {/* Package drop animation */}
          <div className={`package ${stage === "complete" ? "drop" : ""}`}>
            <div className="package-box">
              <div className="package-tape" />
              <div className="package-label">ORDER #{orderId?.slice(-6).toUpperCase() || "000000"}</div>
            </div>
          </div>
          
          {/* Destination house */}
          <div className={`house ${stage === "complete" ? "show" : ""}`}>
            <div className="house-body">
              <div className="roof" />
              <div className="door" />
              <div className="window" />
            </div>
          </div>
        </div>
        
        {/* Status text */}
        <div className="status-text">
          {stage === "preparing" && (
            <>
              <h3 className="title">Processing Order...</h3>
              <p className="subtitle">Preparing your items</p>
            </>
          )}
          {stage === "loading" && (
            <>
              <h3 className="title">Loading Truck...</h3>
              <p className="subtitle">Packing your remote controls</p>
            </>
          )}
          {stage === "delivering" && (
            <>
              <h3 className="title">On the Way!</h3>
              <p className="subtitle">Your order is being delivered</p>
            </>
          )}
          {stage === "complete" && (
            <>
              <h3 className="title success">Order Delivered!</h3>
              <p className="subtitle success">Thank you for shopping with AllRemotes</p>
            </>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="progress-container">
          <div 
            className="progress-bar"
            style={{
              width: stage === "preparing" ? "25%" : stage === "loading" ? "50%" : stage === "delivering" ? "75%" : "100%"
            }}
          />
        </div>
      </div>

      <style jsx>{`
        .order-success-animation {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 2rem;
        }

        .animation-container {
          width: 100%;
          max-width: 500px;
          background: linear-gradient(180deg, #87CEEB 0%, #E0F6FF 60%, #f5f5f5 100%);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
        }

        .scene {
          position: relative;
          height: 280px;
          overflow: hidden;
        }

        /* Sun */
        .sun {
          position: absolute;
          top: 20px;
          right: 30px;
          width: 50px;
          height: 50px;
          background: #FFD700;
          border-radius: 50%;
          box-shadow: 0 0 40px #FFD700, 0 0 80px #FFA500;
          opacity: 0.8;
          transition: transform 0.5s ease;
        }

        .sun.animate {
          animation: sunPulse 3s ease-in-out infinite;
        }

        @keyframes sunPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.1); opacity: 1; }
        }

        /* Clouds */
        .cloud {
          position: absolute;
          background: white;
          border-radius: 100px;
          opacity: 0.8;
        }

        .cloud::before,
        .cloud::after {
          content: '';
          position: absolute;
          background: white;
          border-radius: 100px;
        }

        .cloud-1 {
          width: 60px;
          height: 20px;
          top: 30px;
          left: -80px;
        }

        .cloud-1::before {
          width: 30px;
          height: 30px;
          top: -15px;
          left: 10px;
        }

        .cloud-1::after {
          width: 25px;
          height: 25px;
          top: -10px;
          left: 30px;
        }

        .cloud-2 {
          width: 50px;
          height: 18px;
          top: 60px;
          left: -60px;
        }

        .cloud-2::before {
          width: 25px;
          height: 25px;
          top: -12px;
          left: 8px;
        }

        .cloud-2::after {
          width: 20px;
          height: 20px;
          top: -8px;
          left: 25px;
        }

        .cloud.animate {
          animation: cloudMove 8s linear infinite;
        }

        @keyframes cloudMove {
          from { transform: translateX(0); }
          to { transform: translateX(600px); }
        }

        /* Road */
        .road {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 80px;
          background: linear-gradient(180deg, #555 0%, #333 100%);
          border-top: 4px solid #444;
        }

        .road-lines {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 4px;
          background: repeating-linear-gradient(
            90deg,
            #FFD700 0px,
            #FFD700 30px,
            transparent 30px,
            transparent 60px
          );
        }

        .road-lines.animate {
          animation: roadMove 0.5s linear infinite;
        }

        @keyframes roadMove {
          from { transform: translateX(0); }
          to { transform: translateX(-60px); }
        }

        /* Truck */
        .truck-container {
          position: absolute;
          bottom: 35px;
          left: 50%;
          transform: translateX(-50%);
          transition: transform 0.3s ease;
        }

        .truck-container.animate {
          animation: truckDrive 2.5s ease-in-out forwards;
        }

        .truck-container.delivered {
          transform: translateX(150px) scale(0.8);
          opacity: 0.7;
        }

        @keyframes truckDrive {
          0% { transform: translateX(-200px); }
          30% { transform: translateX(-50%) translateY(-5px); }
          40% { transform: translateX(-50%) translateY(0); }
          70% { transform: translateX(-50%) translateY(-3px); }
          100% { transform: translateX(150px); }
        }

        .truck {
          position: relative;
          width: 140px;
          height: 70px;
        }

        .truck-body {
          display: flex;
          align-items: flex-end;
        }

        /* Cab */
        .cab {
          width: 50px;
          height: 45px;
          background: linear-gradient(180deg, #FF6B35 0%, #E55A2B 100%);
          border-radius: 8px 8px 0 0;
          position: relative;
          z-index: 2;
        }

        .cab-window {
          position: absolute;
          top: 8px;
          left: 8px;
          right: 8px;
          height: 18px;
          background: linear-gradient(180deg, #87CEEB 0%, #B0E0E6 100%);
          border-radius: 4px;
          border: 2px solid #CC5500;
        }

        .cab-door {
          position: absolute;
          bottom: 8px;
          left: 8px;
          width: 15px;
          height: 12px;
          border: 1px solid #CC5500;
          border-radius: 2px;
        }

        /* Trailer */
        .trailer {
          width: 85px;
          height: 50px;
          background: linear-gradient(180deg, #F5F5F5 0%, #E0E0E0 100%);
          border-radius: 4px;
          margin-left: 2px;
          position: relative;
          border: 2px solid #CCC;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .trailer-side {
          width: 100%;
          text-align: center;
        }

        .logo {
          font-size: 8px;
          font-weight: bold;
          color: #FF6B35;
          letter-spacing: 0.5px;
        }

        /* Wheels */
        .wheel {
          position: absolute;
          bottom: -12px;
          width: 22px;
          height: 22px;
          background: #333;
          border-radius: 50%;
          border: 3px solid #555;
          box-shadow: inset 0 0 5px rgba(0,0,0,0.5);
        }

        .wheel::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          background: #777;
          border-radius: 50%;
        }

        .wheel-front {
          left: 30px;
          animation: wheelSpin 0.3s linear infinite;
        }

        .wheel-back-1 {
          right: 55px;
          animation: wheelSpin 0.3s linear infinite;
        }

        .wheel-back-2 {
          right: 25px;
          animation: wheelSpin 0.3s linear infinite;
        }

        .truck-container.animate .wheel,
        .truck-container.delivered .wheel {
          animation: wheelSpin 0.3s linear infinite;
        }

        @keyframes wheelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Smoke */
        .smoke {
          position: absolute;
          left: -10px;
          bottom: 10px;
          display: flex;
          gap: 3px;
        }

        .smoke span {
          width: 8px;
          height: 8px;
          background: rgba(100, 100, 100, 0.4);
          border-radius: 50%;
          opacity: 0;
        }

        .smoke.animate span {
          animation: smokePuff 1s ease-out infinite;
        }

        .smoke.animate span:nth-child(2) {
          animation-delay: 0.3s;
        }

        .smoke.animate span:nth-child(3) {
          animation-delay: 0.6s;
        }

        @keyframes smokePuff {
          0% { transform: translateX(0) scale(0.5); opacity: 0.6; }
          100% { transform: translateX(-30px) scale(1.5); opacity: 0; }
        }

        /* Package */
        .package {
          position: absolute;
          bottom: 80px;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
        }

        .package.drop {
          animation: packageDrop 0.8s ease-out forwards;
        }

        @keyframes packageDrop {
          0% { 
            opacity: 0;
            transform: translateX(-50%) translateY(-50px) scale(0.8);
          }
          50% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          70% {
            transform: translateX(-50%) translateY(-5px) scale(1);
          }
          100% { 
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        .package-box {
          width: 60px;
          height: 50px;
          background: linear-gradient(135deg, #D4A574 0%, #C49A6C 100%);
          border-radius: 4px;
          position: relative;
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }

        .package-tape {
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 12px;
          background: rgba(255, 255, 255, 0.4);
          transform: translateY(-50%);
        }

        .package-label {
          position: absolute;
          top: 5px;
          left: 5px;
          right: 5px;
          font-size: 6px;
          color: #5D4E37;
          font-weight: bold;
          text-align: center;
          background: rgba(255, 255, 255, 0.8);
          padding: 2px;
          border-radius: 2px;
        }

        /* House */
        .house {
          position: absolute;
          bottom: 80px;
          right: 30px;
          opacity: 0;
          transform: scale(0.8);
          transition: all 0.5s ease;
        }

        .house.show {
          opacity: 1;
          transform: scale(1);
        }

        .house-body {
          width: 50px;
          height: 40px;
          background: #F5F5DC;
          position: relative;
          border: 2px solid #8B7355;
        }

        .roof {
          position: absolute;
          top: -20px;
          left: -5px;
          right: -5px;
          height: 20px;
          background: #8B4513;
          clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
        }

        .door {
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 15px;
          height: 25px;
          background: #654321;
          border-radius: 2px 2px 0 0;
        }

        .window {
          position: absolute;
          top: 8px;
          right: 5px;
          width: 12px;
          height: 12px;
          background: #87CEEB;
          border: 2px solid #654321;
        }

        /* Status text */
        .status-text {
          text-align: center;
          padding: 1.5rem;
          background: white;
        }

        .title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #333;
          margin: 0 0 0.5rem 0;
          transition: color 0.3s ease;
        }

        .title.success {
          color: #22C55E;
        }

        .subtitle {
          font-size: 0.9rem;
          color: #666;
          margin: 0;
          transition: color 0.3s ease;
        }

        .subtitle.success {
          color: #16A34A;
        }

        /* Progress bar */
        .progress-container {
          height: 4px;
          background: #E5E7EB;
          margin: 0 1.5rem 1.5rem;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #FF6B35 0%, #22C55E 100%);
          border-radius: 2px;
          transition: width 0.5s ease;
        }
      `}</style>
    </div>
  );
}
