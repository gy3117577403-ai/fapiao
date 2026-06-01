from decimal import Decimal, ROUND_HALF_UP

CN_DIGITS = "零壹贰叁肆伍陆柒捌玖"
CN_UNITS = ("", "拾", "佰", "仟")
CN_SECTION_UNITS = ("", "万", "亿", "兆")


def _section_to_chinese(section: int) -> str:
    result: list[str] = []
    zero_pending = False

    for index in range(4):
        digit = section % 10
        if digit == 0:
            if result:
                zero_pending = True
        else:
            if zero_pending:
                result.append(CN_DIGITS[0])
                zero_pending = False
            result.append(CN_UNITS[index])
            result.append(CN_DIGITS[digit])
        section //= 10

    return "".join(reversed(result))


def amount_to_chinese_upper(value: Decimal) -> str:
    amount = value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    if amount < 0:
        raise ValueError("金额不能为负数")
    if amount == Decimal("0.00"):
        return "零元整"

    cents = int((amount * 100).to_integral_value(rounding=ROUND_HALF_UP))
    integer = cents // 100
    fraction = cents % 100

    integer_parts: list[str] = []
    section_index = 0
    need_zero = False

    if integer == 0:
        integer_text = ""
    else:
        while integer > 0:
            section = integer % 10000
            if section == 0:
                if integer_parts:
                    need_zero = True
            else:
                section_text = _section_to_chinese(section)
                if need_zero and not section_text.startswith(CN_DIGITS[0]):
                    integer_parts.append(CN_DIGITS[0])
                    need_zero = False
                integer_parts.append(section_text + CN_SECTION_UNITS[section_index])
                if section < 1000 and integer // 10000 > 0:
                    need_zero = True
            integer //= 10000
            section_index += 1
        integer_text = "".join(reversed(integer_parts)).strip(CN_DIGITS[0])

    jiao = fraction // 10
    fen = fraction % 10

    if integer_text:
        result = integer_text + "元"
    else:
        result = ""

    if fraction == 0:
        return result + "整"

    if jiao:
        result += CN_DIGITS[jiao] + "角"
    elif integer_text and fen:
        result += "零"

    if fen:
        result += CN_DIGITS[fen] + "分"

    return result
