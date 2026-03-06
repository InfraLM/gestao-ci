
import React from 'react';

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    change?: string;
    changeColor?: string;
    bgColor?: string;
    iconColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, change, changeColor = 'text-gray-500', bgColor = 'bg-white', iconColor = 'text-gray-500' }) => {
    return (
        <div className={`${bgColor} p-6 rounded-xl shadow-md flex items-start justify-between`}>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
                {change && <p className={`text-sm mt-2 ${changeColor}`}>{change}</p>}
            </div>
            <div className={`p-3 rounded-full ${iconColor}`}>{icon}</div>
        </div>
    );
};

export default StatCard;
