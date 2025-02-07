import * as React from 'react';
const SpeedValue = (props) => {
    const { actions, secperhour, multiplySpeed, maxsecperhour, maxmultiplySpeed, min: prop_min, id, className } = props;
    const setSecPerHour = React.useCallback((e) => {
        const value = +e.target.value;
        const secperhour = Math.min(maxsecperhour, Math.max(prop_min, value));
        actions.setSecPerHour(secperhour);
    }, [maxsecperhour, prop_min]);
    const setMultiplySpeed = React.useCallback((e) => {
        const value = +e.target.value;
        const multiplySpeed = Math.min(maxmultiplySpeed, Math.max(prop_min, value));
        actions.setMultiplySpeed(multiplySpeed);
    }, [maxmultiplySpeed, prop_min]);
    const Result = React.useMemo(() => secperhour ?
        React.createElement("input", { type: "number", value: secperhour, min: prop_min, max: maxsecperhour, onChange: setSecPerHour, id: id, className: className })
        : multiplySpeed ?
            React.createElement("input", { type: "number", value: multiplySpeed, min: prop_min, max: maxmultiplySpeed, onChange: setMultiplySpeed, id: id, className: className })
            : React.createElement("p", null, "SpeedValue props error!"), [props]);
    return Result;
};
SpeedValue.defaultProps = {
    maxsecperhour: 3600,
    maxmultiplySpeed: 3600,
    min: 1,
    className: 'harmovis_input_number'
};
export default SpeedValue;
//# sourceMappingURL=speed-value.js.map